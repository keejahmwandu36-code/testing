<?php

use App\Http\Controllers\CampusController;
use App\Http\Controllers\CampusModeOfStudyController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\ModeOfStudyController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\StudentMaterialController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::middleware('role:admin')->group(function () {
        Route::resource('campuses', CampusController::class)->except('destroy');
        Route::resource('schools', SchoolController::class)->except('destroy');
        Route::resource('programs', ProgramController::class)->except('destroy');
        Route::get('programs/{program}/curriculum', [CurriculumController::class, 'index'])->name('programs.curriculum');
        Route::post('programs/{program}/curriculum', [CurriculumController::class, 'store'])->name('programs.curriculum.store');
        Route::delete('programs/{program}/curriculum/{course}', [CurriculumController::class, 'destroy'])->name('programs.curriculum.destroy');
        Route::resource('departments', DepartmentController::class)->except(['destroy']);
        Route::patch('departments/{department}/status', [DepartmentController::class, 'toggleStatus'])->name('departments.toggle-status');
        Route::resource('users', UserController::class)->except(['destroy']);
        Route::resource('lecturers', LecturerController::class)->only([
            'index',
            'show',
            'edit',
            'update',
        ]);
        Route::resource('courses', CourseController::class)->except(['index', 'show']);

        // ---------------------------------------------------------
        // Enrollments
        // ---------------------------------------------------------

        // Bulk routes must be registered before the resource so
        // `enrollments/bulk/create` isn't captured by
        // `enrollments/{enrollment}` on GET.
        Route::get(
            'enrollments/bulk/create',
            [EnrollmentController::class, 'createBulk']
        )->name('enrollments.bulk.create');

        Route::post(
            'enrollments/bulk',
            [EnrollmentController::class, 'storeBulk']
        )->name('enrollments.bulk.store');

        Route::resource('enrollments', EnrollmentController::class)
            ->except(['show']);

        Route::patch(
            'enrollments/{enrollment}/status',
            [EnrollmentController::class, 'toggleStatus']
        )->name('enrollments.toggle-status');

        Route::get(
            'course-offerings/{courseOffering}/materials',
            [StudentMaterialController::class, 'index']
        )->name('student-materials.index');
        Route::get(
            'course-offerings/{courseOffering}/materials/create',
            [StudentMaterialController::class, 'create']
        )->name('student-materials.create');

        Route::post(
            'course-offerings/{courseOffering}/materials',
            [StudentMaterialController::class, 'store']
        )->name('student-materials.store');

        Route::get(
            'student-materials/{studentMaterial}',
            [StudentMaterialController::class, 'show']
        )->name('student-materials.show');

        Route::get(
            'student-materials/{studentMaterial}/edit',
            [StudentMaterialController::class, 'edit']
        )->name('student-materials.edit');

        Route::put(
            'student-materials/{studentMaterial}',
            [StudentMaterialController::class, 'update']
        )->name('student-materials.update');

        Route::get(
            'student-materials/{studentMaterial}/download',
            [StudentMaterialController::class, 'download']
        )->name('student-materials.download');
    });

    Route::resource('course-offerings', CourseOfferingController::class)->except('destroy');

    // ---------------------------------------------------------
    // Mode of Study
    // ---------------------------------------------------------

    Route::resource('mode-of-studies', ModeOfStudyController::class)
        ->parameters([
            'mode-of-studies' => 'modeOfStudy',
        ]);

    Route::patch(
        'mode-of-studies/{modeOfStudy}/status',
        [ModeOfStudyController::class, 'toggleStatus']
    )->name('mode-of-studies.toggle-status');

    // ---------------------------------------------------------
    // Campus Mode of Study
    // ---------------------------------------------------------

    Route::get(
        'campus-mode-of-studies',
        [CampusModeOfStudyController::class, 'index']
    )->name('campus-mode-of-studies.index');

    Route::get(
        'mode-of-studies/{modeOfStudy}/campuses',
        [CampusModeOfStudyController::class, 'edit']
    )->name('mode-of-studies.campuses.edit');

    Route::patch(
        'mode-of-studies/{modeOfStudy}/campuses',
        [CampusModeOfStudyController::class, 'update']
    )->name('mode-of-studies.campuses.update');
});

require __DIR__.'/rooms.php';
require __DIR__.'/academic-years.php';
require __DIR__.'/settings.php';
require __DIR__.'/announcements.php';
require __DIR__.'/leadership-appointments.php';