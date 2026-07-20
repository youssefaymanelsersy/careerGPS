import { db } from "./src/db";
import { generateCalendar } from "./src/modules/calendar/services/generator";

async function main() {
    // We will just run the generator and log the calendarEvents for the user.
    const userRecord = await db.query.user.findFirst();
    const userId = userRecord!.id;
    const events = await generateCalendar(userId);
    console.log(events.map(e => ({
        title: e.nodeTitle,
        date: e.event.date,
        startTime: e.event.startTime,
        endTime: e.event.endTime,
        duration: e.event.duration
    })));
    process.exit(0);
}
main();
