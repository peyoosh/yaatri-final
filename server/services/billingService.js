const generateInvoice = (destination, user = {}) => {
  const hotelProfiles = (destination.assignedHotels || []).map(hotel => {
    const guideFee = Math.round((hotel.basePrice || 0) * 0.15);
    const charge = (hotel.basePrice || 0) + guideFee;
    return {
      hotelId: hotel._id,
      hotelName: hotel.name,
      basePrice: hotel.basePrice || 0,
      guideFee,
      charge,
      features: hotel.features || []
    };
  });

  const subtotal = hotelProfiles.reduce((sum, item) => sum + item.charge, 0);
  const vatAmount = Number((subtotal * 0.13).toFixed(2));
  const totalDue = Number((subtotal + vatAmount).toFixed(2));

  return {
    invoiceNumber: `YAATRI-${Date.now()}`,
    issuedAt: new Date().toISOString(),
    customer: {
      id: user._id || null,
      username: user.username || 'Guest Traveler',
      email: user.email || 'not-provided@example.com',
      preferences: user.preferences || ''
    },
    destination: {
      id: destination._id,
      name: destination.name,
      region: destination.region,
      terrainType: destination.terrainType,
      difficulty: destination.difficulty || 'Standard'
    },
    lineItems: hotelProfiles,
    totals: {
      subtotal: Number(subtotal.toFixed(2)),
      vat: vatAmount,
      totalDue
    },
    vatRate: 0.13,
    notes: 'All hotel charges include guide fee estimates. VAT is calculated at the Nepal standard rate of 13%.'
  };
};

module.exports = {
  generateInvoice
};
