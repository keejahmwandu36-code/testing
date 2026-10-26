<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\ModeOfStudy;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    /**
     * Display a paginated, searchable, filterable list of enrollments.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $offeringId = $request->integer('course_offering_id') ?: null;
        $status = $request->input('status');

        $enrollments = Enrollment::query()
            ->with([
                'student:id,student_number,user_id,program_id',
                'student.user:id,first_name,last_name,other_names,email',
                'courseOffering:id,course_id,semester_id,campus_id,mode_of_study_id,status',
                'courseOffering.course:id,code,name',
                'courseOffering.semester:id,name',
            ])
            ->when($search, function ($query, $search) {
                $query->whereHas('student.user', function ($uq) use ($search) {
                    $uq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('other_names', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('student', function ($sq) use ($search) {
                    $sq->where('student_number', 'like', "%{$search}%");
                });
            })
            ->when($offeringId, function ($query, $offeringId) {
                $query->where('course_offering_id', $offeringId);
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderByDesc('enrolled_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Enrollment $e) => [
                'id' => $e->id,
                'status' => $e->status,
                'enrolled_at' => $e->enrolled_at?->toIso8601String(),
                'student' => $e->student ? [
                    'id' => $e->student->id,
                    'student_number' => $e->student->student_number,
                    'fullname' => $e->student->user?->full_name ?? '—',
                    'email' => $e->student->user?->email ?? null,
                ] : null,
                'course_offering' => $e->courseOffering ? [
                    'id' => $e->courseOffering->id,
                    'course' => $e->courseOffering->course ? [
                        'code' => $e->courseOffering->course->code,
                        'name' => $e->courseOffering->course->name,
                    ] : null,
                    'semester' => $e->courseOffering->semester ? [
                        'name' => $e->courseOffering->semester->name,
                    ] : null,
                ] : null,
            ]);

        return Inertia::render('enrollments/index', [
            'enrollments' => $enrollments,
            'offering_options' => $this->offeringOptions(),
            'filters' => [
                'search' => $search,
                'course_offering_id' => $offeringId,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the create form: either pick an existing student, or
     * create a new user + student in the same submission.
     */
    public function create(): Response
    {
        return Inertia::render('enrollments/create', [
            'student_options' => $this->studentOptions(),
            'offering_options' => $this->offeringOptions(),
            'program_options' => $this->programOptions(),
            'campus_options' => $this->campusOptions(),
            'mode_of_study_options' => $this->modeOfStudyOptions(),
            'academic_year_options' => $this->academicYearOptions(),
        ]);
    }

    /**
     * Store an enrollment.
     *
     * Two modes via `mode` field:
     *  - 'existing': pick an existing student (student_id)
     *  - 'new':      create user + student + enrollment in one transaction
     */
    public function store(Request $request)
    {
        $mode = $request->input('mode', 'existing');

        if ($mode === 'new') {
            return $this->storeNewStudent($request);
        }

        return $this->storeExistingStudent($request);
    }

    /**
     * Bulk-enrollment form.
     */
    public function createBulk(Request $request): Response
    {
        $preselected = $request->integer('course_offering_id') ?: null;

        return Inertia::render('enrollments/bulk', [
            'offering_options' => $this->offeringOptions(),
            'student_options' => $this->studentOptions(),
            'preselected_offering_id' => $preselected,
        ]);
    }

    /**
     * Store a batch of enrollments for one offering.
     */
    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'course_offering_id' => ['required', 'integer', 'exists:course_offerings,id'],
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:students,id'],
        ]);

        $offeringId = $validated['course_offering_id'];
        $studentIds = $validated['student_ids'];

        $existing = Enrollment::where('course_offering_id', $offeringId)
            ->whereIn('student_id', $studentIds)
            ->pluck('student_id')
            ->all();

        $toCreate = array_diff($studentIds, $existing);

        $inserted = 0;

        DB::transaction(function () use ($toCreate, $offeringId, &$inserted) {
            foreach ($toCreate as $studentId) {
                Enrollment::create([
                    'student_id' => $studentId,
                    'course_offering_id' => $offeringId,
                    'status' => 'enrolled',
                    'enrolled_at' => now(),
                ]);
                $inserted++;
            }
        });

        $skipped = count($existing);

        $message = "Enrolled {$inserted} student(s).";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} already enrolled.";
        }

        return redirect()
            ->route('enrollments.index')
            ->with('success', $message);
    }

    /**
     * Show the edit form. Only the status can be changed.
     */
    public function edit(Enrollment $enrollment): Response
    {
        $enrollment->load([
            'student.user:id,first_name,last_name,other_names,email',
            'student:id,student_number,user_id',
            'courseOffering.course:id,code,name',
            'courseOffering.semester:id,name',
        ]);

        return Inertia::render('enrollments/edit', [
            'enrollment' => [
                'id' => $enrollment->id,
                'status' => $enrollment->status,
                'enrolled_at' => $enrollment->enrolled_at?->toIso8601String(),
                'student' => $enrollment->student ? [
                    'id' => $enrollment->student->id,
                    'student_number' => $enrollment->student->student_number,
                    'fullname' => $enrollment->student->user?->full_name ?? '—',
                    'email' => $enrollment->student->user?->email ?? null,
                ] : null,
                'course_offering' => $enrollment->courseOffering ? [
                    'id' => $enrollment->courseOffering->id,
                    'course' => $enrollment->courseOffering->course ? [
                        'code' => $enrollment->courseOffering->course->code,
                        'name' => $enrollment->courseOffering->course->name,
                    ] : null,
                    'semester' => $enrollment->courseOffering->semester ? [
                        'name' => $enrollment->courseOffering->semester->name,
                    ] : null,
                ] : null,
            ],
        ]);
    }

    /**
     * Update the enrollment status only.
     */
    public function update(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['enrolled', 'dropped', 'completed'])],
        ]);

        $enrollment->update(['status' => $validated['status']]);

        return redirect()
            ->route('enrollments.index')
            ->with('success', 'Enrollment status updated.');
    }

    /**
     * Quick status cycle: enrolled ↔ dropped.
     */
    public function toggleStatus(Enrollment $enrollment)
    {
        $enrollment->update([
            'status' => $enrollment->status === 'enrolled' ? 'dropped' : 'enrolled',
        ]);

        return back()->with('success', 'Enrollment status updated.');
    }

    /**
     * Delete an enrollment — guarded.
     */
    public function destroy(Enrollment $enrollment)
    {
        $offeringId = $enrollment->course_offering_id;
        $studentId = $enrollment->student_id;

        $hasResults = \App\Models\Result::where('course_offering_id', $offeringId)
            ->where('student_id', $studentId)
            ->exists();

        if ($hasResults) {
            return back()->withErrors([
                'destroy' => 'Cannot delete — this student has results in this offering.',
            ]);
        }

        $hasScores = \App\Models\AssessmentScore::where('student_id', $studentId)
            ->whereHas('assessment', function ($q) use ($offeringId) {
                $q->where('course_offering_id', $offeringId);
            })
            ->exists();

        if ($hasScores) {
            return back()->withErrors([
                'destroy' => 'Cannot delete — this student has assessment scores in this offering.',
            ]);
        }

        $hasSubmissions = \App\Models\AssignmentSubmission::where('student_id', $studentId)
            ->whereHas('assignment', function ($q) use ($offeringId) {
                $q->where('course_offering_id', $offeringId);
            })
            ->exists();

        if ($hasSubmissions) {
            return back()->withErrors([
                'destroy' => 'Cannot delete — this student has assignment submissions in this offering.',
            ]);
        }

        $enrollment->delete();

        return redirect()
            ->route('enrollments.index')
            ->with('success', 'Enrollment deleted.');
    }

    /**
     * Store an enrollment for an existing student.
     */
    private function storeExistingStudent(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'course_offering_id' => ['required', 'integer', 'exists:course_offerings,id'],
            'status' => ['required', Rule::in(['enrolled', 'dropped', 'completed'])],
        ]);

        $exists = Enrollment::where('student_id', $validated['student_id'])
            ->where('course_offering_id', $validated['course_offering_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'student_id' => 'This student is already enrolled in this offering.',
            ])->withInput();
        }

        Enrollment::create([
            'student_id' => $validated['student_id'],
            'course_offering_id' => $validated['course_offering_id'],
            'status' => $validated['status'],
            'enrolled_at' => now(),
        ]);

        return redirect()
            ->route('enrollments.index')
            ->with('success', 'Enrollment created successfully.');
    }

    /**
     * Create a new user + student + enrollment in one transaction.
     *
     * Student number = {entry academic year}{national_id}.
     * Password = student number.
     */
    private function storeNewStudent(Request $request)
    {
        $validated = $request->validate([
            // User fields
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'other_names' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'national_id_number' => [
                'required',
                'string',
                'max:255',
                'unique:users,national_id_number',
            ],

            // Student fields
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'campus_id' => ['required', 'integer', 'exists:campuses,id'],
            'mode_of_study_id' => ['required', 'integer', 'exists:mode_of_studies,id'],
            'entry_academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'current_year_of_study' => ['required', 'integer', 'min:1', 'max:10'],
            'current_semester_number' => ['required', 'integer', 'min:1', 'max:4'],
            'admission_date' => ['required', 'date'],

            // Enrollment field
            'course_offering_id' => ['required', 'integer', 'exists:course_offerings,id'],
        ]);

        $studentNumber = null;

        DB::transaction(function () use ($validated, &$studentNumber) {
            $year = AcademicYear::find($validated['entry_academic_year_id']);
            $yearPrefix = substr($year->name, 0, 4);

            $studentNumber = $yearPrefix.$validated['national_id_number'];

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'other_names' => $validated['other_names'] ?? null,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'national_id_number' => $validated['national_id_number'],
                'status' => 'active',
                'password' => $studentNumber,
                'email_verified_at' => now(),
            ]);

            $user->assignRole('student');

            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $studentNumber,
                'program_id' => $validated['program_id'],
                'campus_id' => $validated['campus_id'],
                'mode_of_study_id' => $validated['mode_of_study_id'],
                'entry_academic_year_id' => $validated['entry_academic_year_id'],
                'current_year_of_study' => $validated['current_year_of_study'],
                'current_semester_number' => $validated['current_semester_number'],
                'status' => 'active',
                'admission_date' => $validated['admission_date'],
            ]);

            Enrollment::create([
                'student_id' => $student->id,
                'course_offering_id' => $validated['course_offering_id'],
                'status' => 'enrolled',
                'enrolled_at' => now(),
            ]);
        });

        return redirect()
            ->route('enrollments.index')
            ->with(
                'success',
                "Student {$studentNumber} created and enrolled successfully.",
            );
    }

    // -----------------------------------------------------------------
    // Dropdown options builders
    // -----------------------------------------------------------------

    private function offeringOptions(): array
    {
        return CourseOffering::query()
            ->with([
                'course:id,code,name',
                'semester:id,name',
            ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (CourseOffering $o) => [
                'id' => $o->id,
                'label' => ($o->course?->code ?? '—')
                    .' — '.($o->course?->name ?? 'Untitled')
                    .($o->semester?->name ? " ({$o->semester->name})" : ''),
            ])
            ->all();
    }

    private function studentOptions(): array
    {
        return Student::query()
            ->with('user:id,first_name,last_name,other_names,email')
            ->orderBy('student_number')
            ->get()
            ->map(fn (Student $s) => [
                'id' => $s->id,
                'label' => "{$s->student_number} — "
                    .($s->user?->full_name ?? 'Untitled'),
            ])
            ->all();
    }

    private function programOptions(): array
    {
        return Program::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'label' => "{$p->code} — {$p->name}",
            ])
            ->all();
    }

    private function campusOptions(): array
    {
        return Campus::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'label' => "{$c->code} — {$c->name}",
            ])
            ->all();
    }

    private function modeOfStudyOptions(): array
    {
        return ModeOfStudy::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($m) => [
                'id' => $m->id,
                'label' => "{$m->code} — {$m->name}",
            ])
            ->all();
    }

    private function academicYearOptions(): array
    {
        return AcademicYear::query()
            ->orderByDesc('name')
            ->get(['id', 'name'])
            ->map(fn ($a) => [
                'id' => $a->id,
                'label' => $a->name,
            ])
            ->all();
    }
}