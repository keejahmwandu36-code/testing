import React, { FormEventHandler, useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    GraduationCap,
    UserPlus,
    UsersRound,
    BookOpen,
} from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Option {
    id: number;
    label: string;
}

interface Props {
    student_options: Option[];
    offering_options: Option[];
    program_options: Option[];
    campus_options: Option[];
    mode_of_study_options: Option[];
    academic_year_options: Option[];
}

type Mode = 'existing' | 'new';

export default function CreateEnrollment({
    student_options,
    offering_options,
    program_options,
    campus_options,
    mode_of_study_options,
    academic_year_options,
}: Props) {
    const [mode, setMode] = useState<Mode>('existing');

    const { data, setData, post, processing, errors, reset } = useForm({
        mode: 'existing' as Mode,

        // existing student
        student_id: student_options[0]?.id ?? ('' as number | ''),
        status: 'enrolled' as 'enrolled' | 'dropped' | 'completed',

        // new student — user
        first_name: '',
        last_name: '',
        other_names: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        national_id_number: '',

        // new student — student
        program_id: program_options[0]?.id ?? ('' as number | ''),
        campus_id: campus_options[0]?.id ?? ('' as number | ''),
        mode_of_study_id: mode_of_study_options[0]?.id ?? ('' as number | ''),
        entry_academic_year_id:
            academic_year_options[0]?.id ?? ('' as number | ''),
        current_year_of_study: 1,
        current_semester_number: 1,
        admission_date: new Date().toISOString().slice(0, 10),

        // shared
        course_offering_id: offering_options[0]?.id ?? ('' as number | ''),
    });

    useEffect(() => {
        setData('mode', mode);
    }, [mode]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post('/enrollments', {
            preserveScroll: true,
        });
    };

    const noStudents = student_options.length === 0;
    const noOfferings = offering_options.length === 0;
    const noPrograms = program_options.length === 0;
    const noCampuses = campus_options.length === 0;
    const noModes = mode_of_study_options.length === 0;
    const noYears = academic_year_options.length === 0;

    const blocked =
        mode === 'new'
            ? noOfferings || noPrograms || noCampuses || noModes || noYears
            : noOfferings || noStudents;

    return (
        <>
            <Head title="Enroll Student" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/enrollments">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Enroll Student
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Enroll an existing student or create a new one.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={mode === 'existing' ? 'default' : 'outline'}
                        onClick={() => setMode('existing')}
                    >
                        <UsersRound className="h-4 w-4" />
                        Existing Student
                    </Button>

                    <Button
                        type="button"
                        variant={mode === 'new' ? 'default' : 'outline'}
                        onClick={() => setMode('new')}
                    >
                        <UserPlus className="h-4 w-4" />
                        New Student
                    </Button>
                </div>

                {/* Blockers */}
                {mode === 'existing' && noStudents && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        No students available. Switch to{' '}
                        <strong>New Student</strong> to create one.
                    </div>
                )}

                {mode === 'new' &&
                    (noPrograms || noCampuses || noModes || noYears) && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                            Missing prerequisite data. Programs, campuses,
                            modes of study, and academic years must exist before
                            creating a new student.
                        </div>
                    )}

                {noOfferings && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        No course offerings available.
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* ============ EXISTING STUDENT ============ */}
                    {mode === 'existing' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5" />
                                    Select Student
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="student_id">
                                        Student{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>

                                    <select
                                        id="student_id"
                                        value={data.student_id}
                                        onChange={(e) =>
                                            setData(
                                                'student_id',
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : '',
                                            )
                                        }
                                        disabled={blocked}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {noStudents ? (
                                            <option value="">
                                                No students available
                                            </option>
                                        ) : (
                                            student_options.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.label}
                                                </option>
                                            ))
                                        )}
                                    </select>

                                    <InputError message={errors.student_id} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ============ NEW STUDENT — USER ACCOUNT ============ */}
                    {mode === 'new' && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        User Account
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">
                                            First Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="first_name"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter first name"
                                            disabled={blocked}
                                            autoFocus
                                        />
                                        <InputError
                                            message={errors.first_name}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">
                                            Last Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="last_name"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Enter last name"
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={errors.last_name}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="other_names">
                                            Other Names
                                        </Label>
                                        <Input
                                            id="other_names"
                                            value={data.other_names}
                                            onChange={(e) =>
                                                setData(
                                                    'other_names',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Middle or other names"
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={errors.other_names}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={data.phone}
                                            onChange={(e) =>
                                                setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="+260..."
                                            disabled={blocked}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            Email{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="student@example.com"
                                            disabled={blocked}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="national_id_number">
                                            National ID Number{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="national_id_number"
                                            value={data.national_id_number}
                                            onChange={(e) =>
                                                setData(
                                                    'national_id_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 2482223"
                                            disabled={blocked}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Used as the suffix of the student
                                            number (year + national ID).
                                        </p>
                                        <InputError
                                            message={
                                                errors.national_id_number
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <select
                                            id="gender"
                                            value={data.gender}
                                            onChange={(e) =>
                                                setData(
                                                    'gender',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={blocked}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">— Select —</option>
                                            <option value="male">Male</option>
                                            <option value="female">
                                                Female
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                        <InputError message={errors.gender} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">
                                            Date of Birth
                                        </Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={(e) =>
                                                setData(
                                                    'date_of_birth',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={errors.date_of_birth}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* NEW STUDENT — ACADEMIC DETAILS */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5" />
                                        Academic Details
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="program_id">
                                            Program{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="program_id"
                                            value={data.program_id}
                                            onChange={(e) =>
                                                setData(
                                                    'program_id',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {program_options.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.program_id}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="campus_id">
                                            Campus{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="campus_id"
                                            value={data.campus_id}
                                            onChange={(e) =>
                                                setData(
                                                    'campus_id',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {campus_options.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.campus_id}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mode_of_study_id">
                                            Mode of Study{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="mode_of_study_id"
                                            value={data.mode_of_study_id}
                                            onChange={(e) =>
                                                setData(
                                                    'mode_of_study_id',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {mode_of_study_options.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.mode_of_study_id}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="entry_academic_year_id">
                                            Entry Academic Year{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="entry_academic_year_id"
                                            value={data.entry_academic_year_id}
                                            onChange={(e) =>
                                                setData(
                                                    'entry_academic_year_id',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {academic_year_options.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={
                                                errors.entry_academic_year_id
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="current_year_of_study">
                                            Year of Study{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="current_year_of_study"
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={data.current_year_of_study}
                                            onChange={(e) =>
                                                setData(
                                                    'current_year_of_study',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={
                                                errors.current_year_of_study
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="current_semester_number">
                                            Semester{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="current_semester_number"
                                            type="number"
                                            min={1}
                                            max={4}
                                            value={
                                                data.current_semester_number
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'current_semester_number',
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={
                                                errors.current_semester_number
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="admission_date">
                                            Admission Date{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="admission_date"
                                            type="date"
                                            value={data.admission_date}
                                            onChange={(e) =>
                                                setData(
                                                    'admission_date',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={blocked}
                                        />
                                        <InputError
                                            message={errors.admission_date}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* ============ ENROLLMENT ============ */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Enrollment
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="course_offering_id">
                                    Course Offering{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="course_offering_id"
                                    value={data.course_offering_id}
                                    onChange={(e) =>
                                        setData(
                                            'course_offering_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    disabled={blocked}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {noOfferings ? (
                                        <option value="">
                                            No offerings available
                                        </option>
                                    ) : (
                                        offering_options.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.label}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <InputError
                                    message={errors.course_offering_id}
                                />
                            </div>

                            {mode === 'existing' && (
                                <div className="space-y-2">
                                    <Label htmlFor="status">
                                        Initial Status{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) =>
                                            setData(
                                                'status',
                                                e.target.value as
                                                    | 'enrolled'
                                                    | 'dropped'
                                                    | 'completed',
                                            )
                                        }
                                        disabled={blocked}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="enrolled">
                                            Enrolled
                                        </option>
                                        <option value="dropped">Dropped</option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>
                                    <InputError message={errors.status} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info note (only in new-student mode) */}
                    {mode === 'new' && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                            Student number and password will be generated as{' '}
                            <strong>{'{year}{national_id}'}</strong>. The
                            password equals the student number.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={processing || blocked}
                        >
                            {processing
                                ? 'Saving...'
                                : mode === 'new'
                                  ? 'Create & Enroll Student'
                                  : 'Enroll Student'}
                        </Button>

                        <Button variant="outline" asChild>
                            <Link href="/enrollments">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}