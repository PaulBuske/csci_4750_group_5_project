export const checkPayPeriodRange = (currentDate: Date) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const firstDayOfThisMonth = new Date(currentYear, currentMonth, 1);
    const fifteenthOfThisMonth = new Date(
        currentYear,
        currentMonth,
        15,
        23,
        59,
        59,
    );
    const firstOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

    if (
        currentDate >= firstDayOfThisMonth &&
        currentDate <= fifteenthOfThisMonth
    ) {
        const startDate = firstDayOfThisMonth;
        const endDate = fifteenthOfThisMonth;
        return { startDate, endDate };
    } else {
        const startDate = fifteenthOfThisMonth;
        const endDate = firstOfNextMonth;
        return { startDate, endDate };
    }
};
