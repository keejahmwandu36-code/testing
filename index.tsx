import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    ClipboardList,
    Upload,
} from 'lucide-react';

interface EnrollmentRow {
    id: number;
    status: 'enrolled' | 'dropped' | 'completed';
    enrolled_at: string | null;
    student: {
        id: number;
        student_number: string;
        fullname: string;
        email: string | null;
    } | null;
    course_offering: {
        id: number;
        course: {
            code: string;
            name: string;
        } | null;
        semester: {
            name: string;
        } | null;
    } | null;
}

interface Option {
    id: number;
    label: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedEnrollments {
    data: EnrollmentRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    enrollments: PaginatedEnrollments;
    offering_options: Option[];
    filters: {
        search?: string;
        course_offering_id?: number | null;
        status?: 'enrolled' | 'dropped' | 'completed' | null;
    };
}

export default function EnrollmentsIndex({
    enrollments,
    offering_options,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [offeringId, setOfferingId] = useState<number | ''>(
        filters.course_offering_id ?? '',
    );
    const [status, setStatus] = useState<
        '' | 'enrolled' | 'dropped' | 'completed'
    >(filters.status ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            '/enrollments',
            buildQuery({ search: value }),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleOfferingChange = (value: number | '') => {
        setOfferingId(value);

        router.get(
            '/enrollments',
            buildQuery({ course_offering_id: value }),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusChange = (
        value: '' | 'enrolled' | 'dropped' | 'completed',
    ) => {
        setStatus(value);

        router.get(
            '/enrollments',
            buildQuery({ status: value }),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    function buildQuery(
        overrides: Record<string, string | number | null | undefined> = {},
    ) {
        const query: Record<string, string | number> = {};

        const s = overrides.search !== undefined ? overrides.search : search;
        const o =
            overrides.course_offering_id !== undefined
                ? overrides.course_offering_id
                : offeringId;
        const st = overrides.status !== undefined ? overrides.status : status;

        if (s) query.search = String(s);
        if (o !== '' && o !== null && o !== undefined) {
            query.course_offering_id = Number(o);
        }
        if (st) query.status = String(st);

        return query;
    }

    const toggleStatus = (enrollment: EnrollmentRow) => {
        router.patch(
            `/enrollments/${enrollment.id}/status`,
            {},
            { preserveScroll: true },
        );
    };

    const deleteEnrollment = (enrollment: EnrollmentRow) => {
        const name = enrollment.student?.fullname ?? 'this enrollment';
        const code =
            enrollment.course_offering?.course?.code ?? 'this offering';

        if (!confirm(`Delete enrollment of ${name} in ${code}?`)) return;

        router.delete(`/enrollments/${enrollment.id}`, {
            preserveScroll: true,
        });
    };

    const formatStatus = (s: EnrollmentRow['status']) => {
        switch (s) {
            case 'enrolled':
                return 'Enrolled';
            case 'dropped':
                return 'Dropped';
            case 'completed':
                return 'Completed';
        }
    };

    const getStatusClasses = (s: EnrollmentRow['status']) => {
        switch (s) {
            case 'enrolled':
                return 'bg-green-100 text-green-700 hover:bg-green-200';
            case 'dropped':
                return 'bg-red-100 text-red-700 hover:bg-red-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
        }
    };

    const formatDate = (value: string | null) => {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleDateString();
    };

    return (
        <>
            <Head title="Enrollments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Enrollments
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage student enrollments into course offerings.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/enrollments/bulk/create">
                                <Upload className="mr-2 h-4 w-4" />
                                Bulk Enroll
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href="/enrollments/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Enroll Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Search + Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative max-w-md flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    placeholder="Search by student name, number, or email..."
                                    className="pl-9"
                                />
                            </div>

                            <select
                                value={offeringId}
                                onChange={(e) =>
                                    handleOfferingChange(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : '',
                                    )
                                }
                                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-64"
                            >
                                <option value="">All offerings</option>
                                {offering_options.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) =>
                                    handleStatusChange(
                                        e.target.value as
                                            | ''
                                            | 'enrolled'
                                            | 'dropped'
                                            | 'completed',
                                    )
                                }
                                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-44"
                            >
                                <option value="">All statuses</option>
                                <option value="enrolled">Enrolled</option>
                                <option value="dropped">Dropped</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            All Enrollments ({enrollments.total})
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {enrollments.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />

                                <h3 className="mt-4 text-lg font-medium">
                                    No enrollments found
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Get started by enrolling a student.
                                </p>

                                <Button asChild className="mt-4">
                                    <Link href="/enrollments/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Enroll Student
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Student
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Course
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Semester
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Enrolled
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {enrollments.data.map((enrollment) => (
                                            <tr
                                                key={enrollment.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="font-medium">
                                                        {enrollment.student
                                                            ?.fullname ?? '—'}
                                                    </div>
                                                    {enrollment.student && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                enrollment
                                                                    .student
                                                                    .student_number
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-sm">
                                                    {enrollment.course_offering
                                                        ?.course
                                                        ? `${enrollment.course_offering.course.code} — ${enrollment.course_offering.course.name}`
                                                        : '—'}
                                                </td>

                                                <td className="px-3 py-3 text-sm text-muted-foreground">
                                                    {enrollment.course_offering
                                                        ?.semester?.name ??
                                                        '—'}
                                                </td>

                                                <td className="px-3 py-3 text-sm text-muted-foreground">
                                                    {formatDate(
                                                        enrollment.enrolled_at,
                                                    )}
                                                </td>

                                                <td className="px-3 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleStatus(
                                                                enrollment,
                                                            )
                                                        }
                                                        title="Click to toggle between Enrolled and Dropped"
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                            enrollment.status,
                                                        )}`}
                                                    >
                                                        {formatStatus(
                                                            enrollment.status,
                                                        )}
                                                    </button>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/enrollments/${enrollment.id}/edit`}
                                                            >
                                                                <Pencil className="mr-1 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                deleteEnrollment(
                                                                    enrollment,
                                                                )
                                                            }
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="mr-1 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {enrollments.links.length > 3 && (
                    <div className="flex flex-wrap gap-1">
                        {enrollments.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) {
                                        router.get(
                                            link.url,
                                            {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }
                                }}
                                className={`rounded-md px-3 py-2 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-input bg-background text-foreground hover:bg-muted'
                                } ${
                                    !link.url
                                        ? 'cursor-not-allowed opacity-50'
                                        : ''
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}