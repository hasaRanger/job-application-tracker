/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board } from "@/lib/models";
import { redirect } from "next/navigation";
import KanbanBoard from "@/components/kanban-board";
import { Suspense } from "react";

async function getBoard(userId: string) {
    "use cache"

    await connectDB();

    const boardDoc = await Board.findOne({
        userId,
        name: "Job Hunt",
    }).populate({
        path: "columns",
        populate: {
            path: "jobApplications",
        },
    });

    if(!boardDoc) {
        return null;
    }

    const board = JSON.parse(JSON.stringify(boardDoc));

    return board;

}

async function DashboardPage() {
    const session = await getSession();
    const board = await getBoard(session?.user.id ?? "");
    if (!session?.user) {
        redirect("/sign-in");
    }


    console.log("Board data:", JSON.stringify(board, null, 2));
    console.log("Columns:", board?.columns);
    if (board?.columns && board.columns.length > 0) {
        console.log("First column jobApplications:", (board.columns[0] as any)?.jobApplications);
        if ((board.columns[0] as any)?.jobApplications?.length > 0) {
            console.log("First job in first column:", (board.columns[0] as any).jobApplications[0]);
            console.log("First job jobUrl:", (board.columns[0] as any).jobApplications[0]?.jobUrl);
        }
    }

    // Check all jobs for jobUrl
    const allJobs: any[] = [];
    (board?.columns as any[])?.forEach(col => {
        if (col.jobApplications) {
            allJobs.push(...col.jobApplications);
        }
    });
    console.log("Total jobs found:", allJobs.length);
    console.log("Jobs with jobUrl:", allJobs.filter(j => j.jobUrl).length);
    allJobs.forEach(job => {
        console.log(`Job ${job.position} (${job.company}):`, { jobUrl: job.jobUrl });
    });

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-black">Job Hunt</h1>
                    <p className="text-gray-600">Track your job applications in one place.</p>
                </div>
                <KanbanBoard
                    board={board}
                    userId={session.user.id}
                />
            </div>
        </div>
    );
}

export default async function Dashboard() {
    return (
        <Suspense fallback={<p className="text-center text-gray-500">Loading dashboard...</p>}>
            <DashboardPage />
        </Suspense>
    );
}