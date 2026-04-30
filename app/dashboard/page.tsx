/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board } from "@/lib/models";
import { redirect } from "next/navigation";
import KanbanBoard from "@/components/kanban-board";

export default async function Dashboard() {
    const session = await getSession();

    if(!session?.user) {
        redirect("/sign-in");
    }

    await connectDB();

    const board = await Board.findOne({
        userId: session.user.id,
        name: "Job Hunt",
    })
    .populate({
        path: "columns",
        populate: {
            path: "jobApplications",
        },
    })
    .lean();

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
                    board={JSON.parse(JSON.stringify(board))} 
                    userId={session.user.id} 
                />
            </div>
        </div>
    );
}