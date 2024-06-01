import { filter, keyBy, map, set, get, some, keys, every, sum, forEach } from "lodash";
import * as fs from 'fs';
import { csv2json, json2csv } from "json-2-csv";


import { PitonFilePartResult } from "../models/PitonFilePartResult";
import { createCSVFile } from "./file-utility";
import { OutputChannelLogger } from "../logging-and-debugging/OutputChannelLogger";

/**
 * Mark the file part as approved and the re-run
 * @param file The Piton file part result that is approved
 * @returns
 */
export async function approveFilePart(filePart: PitonFilePartResult): Promise<boolean> {
    if (filePart.parsedPart.expect === 'snapshot') {
        return approveSnapshotFilePart(filePart);
    } else {
        return approveNoResultsFilePart(filePart);
    }
}

/**
 * Mark the file part as approved
 * Modifies the filePart.parsePart.csvResultPath with approved that are unset
 * @param file The Piton file part result that is approved
 * @returns true if the approval was successful
 */
async function approveNoResultsFilePart(filePart: PitonFilePartResult): Promise<boolean> {
    // Open the result csv and set all records to approved
    let resultData: object[] = [];
    if (!fs.existsSync(filePart.parsedPart.csvResultPath)) {
        OutputChannelLogger.error(`File needed for approval: ${filePart.parsedPart.csvResultPath}`, true);
        return false;
    }
    resultData = csv2json(fs.readFileSync(filePart.parsedPart.csvResultPath).toString());

    resultData = map(resultData, r => {
        if (get(r, filePart.parsedPart.approveColumn) === 0) { return r; }
        set(r, filePart.parsedPart.approveColumn, 1);
        return r;
    });

    createCSVFile(filePart.parsedPart.csvResultPath, resultData);

    return true;
}

/**
 * Mark the file part as approved for pn-expect snapshot
 * @param file The Piton file part result that is approved
 * @returns true if the approval was successful
 */
async function approveSnapshotFilePart(filePart: PitonFilePartResult): Promise<boolean> {
    // Make *.new.csv now *.snapshot.csv
    if (fs.existsSync(filePart.parsedPart.csvResultPath)) {
        fs.rmSync(filePart.parsedPart.csvResultPath);
    }

    if (!fs.existsSync(filePart.parsedPart.newSnapshotPath)) {
        OutputChannelLogger.error(`File needed for approval: ${filePart.parsedPart.newSnapshotPath}`, true);
        return false;
    }

    const approvedSnapshotData = fs.readFileSync(filePart.parsedPart.newSnapshotPath).toString();
    fs.writeFileSync(filePart.parsedPart.snapshotPath, approvedSnapshotData);
    return true;
}

/**
 * Mark the file part as deny and the re-run
 * @param file The Piton file part result that is approved
 * @returns
 */
export async function denyFilePart(filePart: PitonFilePartResult): Promise<void> {
    if (filePart.parsedPart.expect === 'snapshot') {
        denySnapshotFilePart(filePart);
    } else {
        denyNoResultsFilePart(filePart);
    }
}

/**
 * Mark the file part as denied
 * Modifies the filePart.parsePart.csvResultPath with denied that are unset
 * @param file The Piton file part result that is denied
 * @returns
 */
async function denyNoResultsFilePart(filePart: PitonFilePartResult): Promise<void> {
    // Open the result csv and set all records to denied
    let resultData: object[] = [];
    if (fs.existsSync(filePart.parsedPart.csvResultPath)) {
        resultData = csv2json(fs.readFileSync(filePart.parsedPart.csvResultPath).toString());
    }

    resultData = map(resultData, r => {
        if (get(r, filePart.parsedPart.approveColumn) === 1) { return r; }
        set(r, filePart.parsedPart.approveColumn, 0);
        return r;
    });

    createCSVFile(filePart.parsedPart.csvResultPath, resultData);
}

/**
 * Mark the file part as denied for pn-expect snapshot
 * @param file The Piton file part result that is denied
 * @returns
 */
async function denySnapshotFilePart(filePart: PitonFilePartResult): Promise<void> {
    // Make *.new.csv now *.snapshot.csv
}

