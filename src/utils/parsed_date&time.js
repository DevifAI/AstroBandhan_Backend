export const parseDateTime = (dateofbirth, timeofbirth) => {
    // Parse the date
    const [year, month, date] = dateofbirth.split('-').map(Number);

    // Parse the time
    const timeParts = timeofbirth.split(/[: ]+/); // Split by colon and space
    let [hours, minutes, seconds] = timeParts.map((part) =>
        isNaN(part) ? part : Number(part)  // If it's a number, convert to Number
    );

    // If seconds are not provided, set it to 00
    if (isNaN(seconds)) {
        seconds = 0;
    }

    // Handle AM/PM
    const isPM = timeofbirth.toLowerCase().includes('pm');
    if (isPM && hours < 12) hours += 12; // Convert to 24-hour format
    if (!isPM && hours === 12) hours = 0; // Handle midnight (12 AM is 00:00)

    // Return the result with all parsed values
    return { year, month, date, hours, minutes, seconds };
};
