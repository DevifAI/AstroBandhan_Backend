export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9][0-9]{9}$/; // Indian phone number regex
    return phoneRegex.test(phone); // Returns true if valid, false otherwise
  };