import mongoose, { Schema, Document } from "mongoose";

export interface IJobApplication extends Document {
    company: string;
    position: string;
    location: string;
    status: string;
    columnId: mongoose.Types.ObjectId;
    boardId: mongoose.Types.ObjectId;
    userId: string;
    order: number;
    notes?: string;
    salary?: string;
    jobURL?: string;
    appliedDate?: Date;
    tags?: string[];
    description?: string;
    createdat: Date;
    updatedat: Date; 
}

const JobApplicationSchema = new Schema<IJobApplication>(
    {
        company: {
            type: String,
            required: true
        },
        position: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        columnId: {
            type: Schema.Types.ObjectId,
            ref: "Column",
            required: true,
            index: true
        },
        boardId: {
            type: Schema.Types.ObjectId,
            ref: "Board",
            required: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        order: {
            type: Number,
            required: true,
            default: 0
        },
        notes: {
            type: String
        },
        salary: {
            type: String
        },
        jobURL: {
            type: String
        },
        appliedDate: {
            type: Date
        },
        tags: [
            {
                type: String    
            }
        ], 
        description: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.models.JobApplication || mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);