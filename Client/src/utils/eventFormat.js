export const getEventId = (event) => String(event?._id || event?.id || '');

export const getEventDate = (date) => {
    if (!date) return null;
    if (date.startAt) {
        const parsedStart = new Date(date.startAt);
        if (!Number.isNaN(parsedStart.getTime())) return parsedStart;
    }

    const year = Number(date.year);
    const month = new Date(`${date.month} 1, ${year}`).getMonth();
    const day = Number(date.day);
    if (!year || Number.isNaN(month) || !day) return null;

    const parsedDate = new Date(year, month, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const isEventExpired = (event, now = new Date()) => {
    const eventDate = event?.date;
    if (!eventDate) return false;

    if (eventDate.endAt) {
        const endAt = new Date(eventDate.endAt);
        if (!Number.isNaN(endAt.getTime())) return endAt < now;
    }

    const date = getEventDate({ ...eventDate, startAt: undefined });
    if (!date) return false;

    date.setHours(23, 59, 59, 999);
    return date < now;
};

export const getEventPrice = (price) => {
    const parsedPrice = Number(String(price ?? 0).replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
};
