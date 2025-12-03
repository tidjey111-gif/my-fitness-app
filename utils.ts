export const getWeekDays = (selected: string) => {
    const week = [];
    // FIX: Manually parse YYYY-MM-DD to avoid timezone issues with `new Date(string)`
    const [year, month, day] = selected.split('-').map(Number);
    // Create UTC date at midnight
    const date = new Date(Date.UTC(year, month - 1, day));
    
    const dayOfWeek = date.getUTCDay(); // 0 for Sunday, 1 for Monday
    // Calculate offset to get to Monday (if dayOfWeek is 0 (Sun), offset is -6. If 1 (Mon), offset is 0)
    const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    
    // Create a new date object for the start of the week
    const startDate = new Date(date);
    startDate.setUTCDate(date.getUTCDate() + startOffset);

    for (let i = 0; i < 7; i++) {
        const weekDay = new Date(startDate);
        weekDay.setUTCDate(startDate.getUTCDate() + i);
        week.push(weekDay);
    }
    return week;
};