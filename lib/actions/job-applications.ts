"use server"

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/auth";
import connectDB from "../db";
import { Board, Column, JobApplication } from "../models";

interface JobApplicationData {
    company: string;
    position: string;
    location?: string;
    salary?: string;
    jobUrl?: string;
    tags?: string[];
    description?: string;
    notes?: string;
    columnId: string;
    boardId: string;
}

export async function createJobApplication(data: JobApplicationData) {
    console.log("RAW incoming data:", JSON.stringify(data));
    const session = await getSession();

    if (!session?.user) {
        return { errors: "Unauthorized" }
    }

    await connectDB();

    const {
        company,
        position,
        location,
        salary,
        jobUrl,
        tags,
        notes,
        description,
        columnId,
        boardId
    } = data;

    console.log("createJobApplication - Received data:", { company, position, location, salary, jobUrl, tags, notes, description, columnId, boardId });

    if (!company || !position || !columnId || !boardId) {
        return { error: "Missing required fields" };
    }

    //verify board ownership
    const board = await Board.findOne({ _id: boardId, userId: session.user.id });

    if (!board) {
        return { error: "Unauthorized" };
    }

    //verify column belongs to board
    const column = await Column.findOne({ _id: columnId, boardId: boardId });

    if (!column) {
        return { error: "Invalid column" };
    }

    const maxOrder = (await JobApplication.findOne({ columnId })
        .sort({ order: -1 })
        .select("order")
        .lean()) as { order: number } | null;

    const jobApplication = await JobApplication.create({
        company,
        position,
        location,
        salary,
        jobUrl,
        tags: tags || [],
        notes,
        description,
        columnId,
        boardId,
        userId: session.user.id,
        status: "applied",
        order: maxOrder ? maxOrder.order + 1 : 0
    });

    console.log("Raw jobApplication object:", jobApplication);
    console.log("jobApplication.jobUrl:", jobApplication.jobUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log("jobApplication._doc:", (jobApplication as any)._doc);
    console.log("Created jobApplication:", JSON.stringify(jobApplication, null, 2));

    await Column.findByIdAndUpdate(columnId, {
        $push: { jobApplications: jobApplication._id }
    });

    revalidatePath("/dashboard");

    return { data: JSON.parse(JSON.stringify(jobApplication)) };
}

export async function updateJobApplication(
    id: string, 
    updates: {
        company?: string;
        position?: string;
        location?: string;
        notes?: string;
        salary?: string;
        jobUrl?: string;
        columnId?: string;
        order?: number;
        tags?: string[];
        description?: string;      
    }
) {
    const session = await getSession();

    if (!session?.user) {
        return { errors: "Unauthorized" }
    }

    const jobApplication = await JobApplication.findById(id);

    if(!jobApplication) {
        return { error: "Job application not found" };
    }

    if(jobApplication.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    const { columnId, order, ...otherUpdates } = updates;

    const updatesToApply: Partial<{
        company: string;
        position: string;
        location: string;
        notes: string;
        salary: string;
        jobUrl: string;
        columnId: string;
        order: number;
        tags: string[];
        description: string;
    }> = otherUpdates;

    const currrentColumnId = jobApplication.columnId.toString();
    const newColumnId = columnId?.toString();

    const isMovingToDifferentColumn = newColumnId && newColumnId !== currrentColumnId;

    if(isMovingToDifferentColumn) {
        await Column.findByIdAndUpdate(currrentColumnId, {
            $pull: { jobApplications: id }
        });

        const jobsInTargetColumn = await JobApplication.find({
            columnId: newColumnId,
            _id: { $ne: id },
        })
        .sort({ order: 1 })
        .lean();

        let newOrderValue: number;

        if(order !== undefined && order !== null) {
            newOrderValue = order * 100;

            const jobsThatNeedToShift = jobsInTargetColumn.slice(order);
            for(const job of jobsThatNeedToShift) {
                await JobApplication.findByIdAndUpdate(job._id, {
                    $set: { order: job.order + 100 },
                });
            }
        } else {
            if(jobsInTargetColumn.length > 0) {
                const lastJobOrder = jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
                newOrderValue = lastJobOrder + 100;
            } else {
                newOrderValue = 0;
            }
        }

        updatesToApply.columnId = newColumnId;
        updatesToApply.order = newOrderValue;

        await Column.findByIdAndUpdate(newColumnId, {
            $push: { jobApplications: id }
        });
    } else if(order !== undefined && order !== null) {
        const otherJobsInColumn = await JobApplication.find({
            columnId: currrentColumnId,
            _id: { $ne: id },
        })
        .sort({ order: 1 })
        .lean();

        const currentJobOrder = jobApplication.order || 0;
        const currentPositionIndex = otherJobsInColumn.findIndex(
            (job) => job.order > currentJobOrder
        );
        const oldPositionIndex = 
            currentPositionIndex === -1 
            ? otherJobsInColumn.length 
            : currentPositionIndex;

        const newOrderValue = order * 100;  

        if (order < oldPositionIndex) {
            const jobsToShiftDown = otherJobsInColumn.slice(order, oldPositionIndex);
            for (const job of jobsToShiftDown) {
                await JobApplication.findByIdAndUpdate(job._id, {
                    $set: { order: job.order + 100 },
                });
            }
        } else if (order > oldPositionIndex) {
            const jobsToShiftUp = otherJobsInColumn.slice(oldPositionIndex, order);
            for (const job of jobsToShiftUp) {
                const newOrder = Math.max(0, job.order - 100);
                await JobApplication.findByIdAndUpdate(job._id, {
                    $set: { order: newOrder },
                });
            }
        }

        updatesToApply.order = newOrderValue;
    }

    const updated = await JobApplication.findByIdAndUpdate(id, updatesToApply, { 
        returnDocument: 'after'
    });

    revalidatePath("/dashboard");
    return {data: JSON.parse(JSON.stringify(updated))};
}

export async function deleteJobApplication(id: string) {
    const session = await getSession();

    if (!session?.user) {
        return { errors: "Unauthorized" }
    }

    const jobApplication = await JobApplication.findById(id);

    if(!jobApplication) {
        return { error: "Job application not found" };
    }

    if(jobApplication.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    await Column.findByIdAndUpdate(jobApplication.columnId, {
        $pull: { jobApplications: id }
    });

    await JobApplication.deleteOne({_id: id});
    revalidatePath("/dashboard");
    
    return { data: { message: "Job application deleted successfully" } };
}