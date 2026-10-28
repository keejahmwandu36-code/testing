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
import { Badge } from '@/components/ui/badge';

import {
    Plus,
    Search,
    Eye,
    UserRound,
    Users,
    GraduationCap,
} from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Lecturer {
    id: number;
    staff_number: string | null;
    title?: string | null;
    designation?: string | null;
    employment_type: 'full_time' | 'part_time' | 'visiting';
    status: 'active' | 'on_leave' | 'retired' | 'left';
    department?: Department | null;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    username?: string | null;
    first_name: string;
    last_name: string;
    other_names?: string | null;
    email: string;
    phone?: string | null;
    status: 'active' | 'inactive' | 'suspended';
    roles: Role[];
    lecturer?: Lecturer | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    users: PaginatedUsers;
    filters: {
        search?: string;
    };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'lecturers'>('all');

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            '/users',
            { search: value },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const getFullName = (user: User) => {
        return [user.first_name, user.other_names, user.last_name]
            .filter(Boolean)
            .join(' ');
    };

    const formatRole = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const formatStatus = (status: User['status']) => {
        switch (status) {
            case 'active': return 'Active';
            case 'inactive': return 'Inactive';
            case 'suspended': return 'Suspended';
            default: return status;
        }
    };

    const getInitials = (user: User) => {
        return `${user.first_name?.charAt(0)?.toUpperCase() || ''}${user.last_name?.charAt(0)?.toUpperCase() || ''}`;
    };

    // Filter users based on active tab
    const filteredUsers = users.data.filter(user => {
        const isLecturer = user.roles.some(r => r.name === 'lecturer');
        if (activeTab === 'users') return !isLecturer;
        if (activeTab === 'lecturers') return isLecturer;
        return true;
    });

    const userCount = users.data.filter(u => !u.roles.some(r => r.name === 'lecturer')).length;
    const lecturerCount = users.data.filter(u => u.roles.some(r => r.name === 'lecturer')).length;

    return (
        <>
            <Head title="Users & Lecturers" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Users & Lecturers
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage system users, roles, and lecturer profiles.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/users/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={search}
                                onChange={(event) =>
                                    handleSearch(event.target.value)
                                }
                                placeholder="Search by name, email, username or staff number..."
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>
                                All Users ({users.total})
                            </CardTitle>
                            
                            {/* Tabs */}
                            <div className="flex gap-2">
                                <Button
                                    variant={activeTab === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveTab('all')}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    All ({users.total})
                                </Button>
                                <Button
                                    variant={activeTab === 'users' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveTab('users')}
                                >
                                    <UserRound className="mr-2 h-4 w-4" />
                                    Users ({userCount})
                                </Button>
                                <Button
                                    variant={activeTab === 'lecturers' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveTab('lecturers')}
                                >
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Lecturers ({lecturerCount})
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <div className="py-12 text-center">
                                <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />

                                <h3 className="mt-4 text-lg font-medium">
                                    No {activeTab === 'lecturers' ? 'lecturers' : activeTab === 'users' ? 'users' : 'users or lecturers'} found
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {search
                                        ? 'Try a different search.'
                                        : activeTab === 'lecturers' 
                                            ? 'No lecturers have been created yet.'
                                            : 'Create your first user.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-4 py-3 font-medium">
                                                User
                                            </th>

                                            <th className="px-4 py-3 font-medium">
                                                Email
                                            </th>

                                            <th className="px-4 py-3 font-medium">
                                                Phone
                                            </th>

                                            <th className="px-4 py-3 font-medium">
                                                Roles
                                            </th>

                                            {activeTab !== 'users' && (
                                                <>
                                                    <th className="px-4 py-3 font-medium">
                                                        Staff Number
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Department
                                                    </th>
                                                </>
                                            )}

                                            <th className="px-4 py-3 font-medium">
                                                Status
                                            </th>

                                            <th className="px-4 py-3 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredUsers.map((user) => {
                                            const isLecturer = user.roles.some(r => r.name === 'lecturer');
                                            
                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                                {getInitials(user)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {getFullName(user)}
                                                                </div>
                                                                {user.username && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        @{user.username}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {user.email}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {user.phone || '—'}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles.length > 0 ? (
                                                                user.roles.map(
                                                                    (role) => (
                                                                        <Badge
                                                                            key={
                                                                                role.id
                                                                            }
                                                                            variant={
                                                                                role.name === 'lecturer' 
                                                                                    ? 'default' 
                                                                                    : 'outline'
                                                                            }
                                                                        >
                                                                            {formatRole(
                                                                                role.name,
                                                                            )}
                                                                        </Badge>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    No role
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {activeTab !== 'users' && (
                                                        <>
                                                            <td className="px-4 py-4">
                                                                {isLecturer && user.lecturer ? (
                                                                    <span className="font-mono text-sm">
                                                                        {user.lecturer.staff_number}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {isLecturer && user.lecturer?.department?.name ? (
                                                                    <div>
                                                                        <div>{user.lecturer.department.name}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {user.lecturer.department.code}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="px-4 py-4">
                                                        <Badge
                                                            variant={
                                                                user.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : user.status === 'suspended'
                                                                    ? 'destructive'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {formatStatus(user.status)}
                                                        </Badge>
                                                        {isLecturer && user.lecturer && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {user.lecturer.employment_type?.replace('_', ' ')}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/users/${user.id}`}
                                                                >
                                                                    <Eye className="mr-1 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>

                                                            {isLecturer && user.lecturer && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/lecturers/${user.lecturer.id}`}
                                                                    >
                                                                        <GraduationCap className="mr-1 h-4 w-4" />
                                                                        Profile
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {users.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
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
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
