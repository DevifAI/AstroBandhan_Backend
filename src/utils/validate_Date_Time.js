export const formatISTDateTime = (utcDate) => {
    const date = new Date(utcDate);
  
    // Convert to IST
    const options = {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
  
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    const parts = formatter.formatToParts(date);
  
    const getPart = (type) => parts.find(p => p.type === type)?.value;
  
    const formattedDate = `${getPart('day')}-${getPart('month')}-${getPart('year')}`;
    const formattedTime = `${getPart('hour')}:${getPart('minute')} ${getPart('dayPeriod')}`;
  
    return { formattedDate, formattedTime };
  };
  