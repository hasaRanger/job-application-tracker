/* eslint-disable prefer-const */
import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongoCache {
    client: MongoClient | null;
    db: Db | null;
    promise: Promise<MongoClient> | null;
}

declare global {
    var mongo: MongoCache | undefined;
}

let cached: MongoCache = global.mongo || {
    client: null,
    db: null,
    promise: null,
};

if (!global.mongo) {
    global.mongo = cached;
}

export async function getMongoClient() {
    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable in .env.local");
    }

    if (cached.client) {
        return cached.client;
    }

    if (!cached.promise) {
        cached.promise = new MongoClient(MONGODB_URI).connect();
    }

    try {
        cached.client = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.client;
}

export async function getMongoDb() {
    if (cached.db) {
        return cached.db;
    }

    const client = await getMongoClient();
    cached.db = client.db();

    return cached.db;
}