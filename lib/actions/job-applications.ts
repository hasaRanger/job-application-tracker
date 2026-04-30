"use server"

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

    return { data: JSON.parse(JSON.stringify(jobApplication)) };
}