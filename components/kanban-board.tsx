/* eslint-disable @typescript-eslint/no-explicit-any */
"use-client"

import { Board, Column, JobApplication } from "@/lib/models/models.types";
import { Award, Calendar, CheckCircle2, Mic, MoreVertical, Trash2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import CreateJobApplicationDialog from "./create-job-dialog";
import JobApplicationCard from "./job-application-card";

interface KanbanBoardProps {
    board: Board;
    userId: string;
}

interface ColConfig {
    color: string;
    icon: React.ReactNode;
}

const COLUMN_CONFIG: Array<ColConfig> = [
    { color: "bg-cyan-500", icon: <Calendar className="h-4 w-4" /> },
    { color: "bg-purple-500", icon: <CheckCircle2 className="h-4 w-4" /> },
    { color: "bg-green-500", icon: <Mic className="h-4 w-4" /> },
    { color: "bg-yellow-500", icon: <Award className="h-4 w-4" /> },
    { color: "bg-red-500", icon: <XCircle className="h-4 w-4" /> },
];

function DroppableColumn({
    column,
    config,
    boardId,
    sortedColumns
}: {
    column: Column;
    config: ColConfig;
    boardId: string;
    sortedColumns: Column[];
}) {
    const sortedJobs = column.jobApplications?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return (
        <Card className="min-w-[300px] flex-shrink-0 shadow-md p-0">
            <CardHeader className={`${config.color} text-white rounded-t-lg pb-3 pt-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <CardTitle className="text-white text-base font-semibold">{column.name}</CardTitle>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:bg-white/20"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Column
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col space-y-2 pt-4 px-4 bg-gray-50/50 min-h-[400px] rounded-b-lg">
                {sortedJobs && sortedJobs.length > 0 ? (
                    sortedJobs.map((job) => (
                        <SortableJobCard
                            key={job._id}
                            job={{ ...job, columnId: job.columnId || column._id }}
                            columns={sortedColumns}
                        />
                    ))
                ) : (
                    <p className="text-muted-foreground text-sm">No jobs yet</p>
                )}

                <CreateJobApplicationDialog columnId={column._id} boardId={boardId} />
            </CardContent>
        </Card>
    );
}

function SortableJobCard({
    job,
    columns
}: {
    job: JobApplication;
    columns: Column[]
}) {
    return (
        <div>
            <JobApplicationCard job={job} columns={columns} />
        </div>
    );
}

export default function KanbanBoard({ board, userId }: KanbanBoardProps) {
    const columns = board.columns ?? [];

    console.log("KanbanBoard - Board:", board);
    console.log("KanbanBoard - Columns:", columns);
    console.log("KanbanBoard - Column count:", columns.length);
    
    if (columns.length > 0) {
        console.log("First column:", columns[0]);
        console.log("First column jobApplications:", (columns[0] as any)?.jobApplications);
    }

    const sortedColumns = [...(columns ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));


    return (
        <>
            <div>
                <div>
                    {sortedColumns.map((col, index) => {
                        const config = COLUMN_CONFIG[index] || {
                            color: "bg-gray-500",
                            icon: <Calendar className="h-4 w-4" />
                        };
                        return (
                            <DroppableColumn
                                key={col._id}
                                column={col}
                                config={config}
                                boardId={board._id}
                                sortedColumns={sortedColumns} />
                        );
                    })}
                </div>
            </div>
        </>
    );
}