"use server";
import { MongoClient, Db } from "mongodb";
import { DateTime } from "luxon";
import { environment } from "@/env/environment";

export interface RankEntry {
  name: string;
  score: number;
  tasks: string;
  position: number;
}

export interface RankDocument {
  date: Date;
  ranks: RankEntry[];
}

const uri = environment.database.url!;
const client: MongoClient = new MongoClient(uri);
const clientPromise: Promise<MongoClient> = client.connect();

export async function retrieveRanks(isoDate: string): Promise<RankEntry[]> {
  try {
    const client = await clientPromise;
    const db: Db = client.db();
    const collection = db.collection<RankDocument>(
      environment.database.at_collection
    );

    // To query by date only, we need to consider the full day's range
    // Assuming 'date' field in MongoDB documents is stored as an ISODate (Date object)
    const date = DateTime.fromISO(isoDate);
    const startOfTargetDay = date.startOf("day").toJSDate();
    const endOfTargetDay = date.endOf("day").toJSDate();

    const query = {
      date: {
        $gte: startOfTargetDay,
        $lte: endOfTargetDay,
      },
    };

    // Find the document for the specified date
    const document = await collection.findOne(query);

    if (document && document.ranks) {
      // Sort the ranks by position
      const sortedRanks = document.ranks.sort((a, b) => {
        if (a.position === 0 && b.position === 0) {
          return 0; // Maintain relative order if both are 0
        }
        if (a.position === 0) {
          return 1; // a (0) goes after b
        }
        if (b.position === 0) {
          return -1; // b (0) goes after a
        }
        return a.position - b.position;
      });

      return sortedRanks;
    } else {
      console.log(`No document found for date: ${date.toISODate()}`);
      return [];
    }
  } catch (error) {
    console.error("Failed to retrieve ranks:", error);
    throw new Error("Could not retrieve ranks from the database.");
  }
}
