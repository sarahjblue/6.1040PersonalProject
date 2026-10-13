import { assembleApplication } from "./assembly.ts";
import {disconnectDatabase, connectDatabase} from "./db.ts";

await connectDatabase();

try{
    const application = assembleApplication();
    console.log(JSON.stringify(Object.keys(application.publicInterface.routes).sort()));
} finally {
    await disconnectDatabase();
}
