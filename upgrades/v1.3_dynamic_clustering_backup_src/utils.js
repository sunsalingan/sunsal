
export const calculateMyScore = (rankIndex, totalCount) => {
    if (totalCount === 0) return 0;
    const rawPercent = ((rankIndex + 1) / totalCount) * 100;
    const percent = Math.round(rawPercent);
    if (percent <= 1) return 10;
    if (percent <= 4) return 9;
    if (percent <= 11) return 8;
    if (percent <= 23) return 7;
    if (percent <= 35) return 6;
    if (percent <= 52) return 5;
    if (percent <= 69) return 4;
    if (percent <= 86) return 3;
    if (percent <= 95) return 2;
    return 1;
};
