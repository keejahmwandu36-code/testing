<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimetableSlotRequest;
use App\Http\Requests\UpdateTimetableSlotRequest;
use App\Models\CourseOffering;
use App\Models\ModeOfStudy;
use App\Models\Room;
use App\Models\Timetable;
use App\Services\TimetableClashChecker;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    public function pickMode(Request $request): Response
    {
        $this->authorize('viewAny', Timetable::class);

        $user = $request->user();

        $modesOfStudy = ModeOfStudy::where('status', 'active')
            ->when(! $user->hasRole('admin'), function ($query) use ($user) {
                $query->whereHas('courseOfferings', function ($query) use ($user) {
                    $query->where('lecturer_id', $user->lecturer?->id);
                });
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('timetables/pick-mode', [
            'modesOfStudy' => $modesOfStudy,
            'canManage' => $user->hasRole('admin'),
        ]);
    }

    public function show(Request $request, ModeOfStudy $modeOfStudy): Response
    {
        $this->authorize('viewAny', Timetable::class);

        $user = $request->user();
        $canManage = $user->hasRole('admin');

        if (! $canManage && ! CourseOffering::where('mode_of_study_id', $modeOfStudy->id)
            ->where('lecturer_id', $user->lecturer?->id)
            ->exists()) {
            abort(403);
        }

        $slots = Timetable::query()
            ->where('mode_of_study_id', $modeOfStudy->id)
            ->when(! $canManage, function ($query) use ($user) {
                $query->whereHas('courseOffering', function ($query) use ($user) {
                    $query->where('lecturer_id', $user->lecturer?->id);
                });
            })
            ->with([
                'rooms:id,name',
                'courseOffering.course:id,code,name',
                'courseOffering.lecturer.user:id,first_name,last_name',
            ])
            ->orderBy('start_time')
            ->get();

        $courseOfferings = CourseOffering::where('mode_of_study_id', $modeOfStudy->id)
            ->when(! $canManage, function ($query) use ($user) {
                $query->where('lecturer_id', $user->lecturer?->id);
            })
            ->with(['course:id,code,name', 'lecturer.user:id,first_name,last_name'])
            ->get(['id', 'course_id', 'lecturer_id']);

        return Inertia::render('timetables/grid', [
            'modeOfStudy' => $modeOfStudy,
            'slots' => $slots,
            'courseOfferings' => $courseOfferings,
            'rooms' => $canManage
                ? Room::where('status', 'active')->orderBy('name')->get(['id', 'name'])
                : [],
            'canManage' => $canManage,
        ]);
    }

    public function store(StoreTimetableSlotRequest $request, ModeOfStudy $modeOfStudy, TimetableClashChecker $clashChecker)
    {
        $this->authorize('create', Timetable::class);

        $lecturerId = CourseOffering::findOrFail($request->course_offering_id)->lecturer_id;

        $clashes = $clashChecker->check(
            $modeOfStudy->id,
            $request->day_of_week,
            $request->start_time,
            $request->end_time,
            $request->room_ids,
            $lecturerId,
        );

        if ($clashes && ! $request->boolean('confirm_clash')) {
            return back()->withErrors(['clash' => implode(' ', $clashes)])->withInput();
        }

        $slot = Timetable::create([
            'mode_of_study_id' => $modeOfStudy->id,
            'course_offering_id' => $request->course_offering_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'session_type' => $request->session_type,
            'status' => 'active',
        ]);

        $slot->rooms()->sync($request->room_ids);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slot added to timetable.']);

        return to_route('timetables.show', $modeOfStudy);
    }

    public function update(UpdateTimetableSlotRequest $request, ModeOfStudy $modeOfStudy, Timetable $timetable, TimetableClashChecker $clashChecker)
    {
        $this->authorize('update', $timetable);

        $lecturerId = CourseOffering::findOrFail($request->course_offering_id)->lecturer_id;

        $clashes = $clashChecker->check(
            $modeOfStudy->id,
            $request->day_of_week,
            $request->start_time,
            $request->end_time,
            $request->room_ids,
            $lecturerId,
            ignoreId: $timetable->id,
        );

        if ($clashes && ! $request->boolean('confirm_clash')) {
            return back()->withErrors(['clash' => implode(' ', $clashes)])->withInput();
        }

        $timetable->update([
            'course_offering_id' => $request->course_offering_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'session_type' => $request->session_type,
        ]);

        $timetable->rooms()->sync($request->room_ids);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slot updated.']);

        return to_route('timetables.show', $modeOfStudy);
    }

    public function cancel(ModeOfStudy $modeOfStudy, Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        $timetable->update(['status' => 'cancelled']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slot cancelled.']);

        return back();
    }

    public function reactivate(ModeOfStudy $modeOfStudy, Timetable $timetable)
    {
        $this->authorize('update', $timetable);

        $timetable->update(['status' => 'active']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slot reactivated.']);

        return back();
    }
}
