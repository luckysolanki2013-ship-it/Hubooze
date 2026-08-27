/**
 * Delhivery courier integration
 * Docs: https://track.delhivery.com/api/docs (Waybill/Tracking API)
 */
const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;
const DELHIVERY_BASE = 'https://track.delhivery.com';

// Fetch live tracking status for a waybill (AWB) number
async function trackShipment(waybill) {
  if (!DELHIVERY_TOKEN) throw new Error('Delhivery API token not configured.');
  const url = `${DELHIVERY_BASE}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}&token=${DELHIVERY_TOKEN}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Token ${DELHIVERY_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Delhivery API error: ${res.status}`);
  const data = await res.json();
  const shipment = data?.ShipmentData?.[0]?.Shipment;
  if (!shipment) return null;
  return {
    waybill: shipment.AWB,
    status: shipment.Status?.Status || 'Unknown',
    statusType: shipment.Status?.StatusType || '',
    statusDateTime: shipment.Status?.StatusDateTime || '',
    origin: shipment.Origin,
    destination: shipment.Destination,
    expectedDelivery: shipment.ExpectedDeliveryDate || null,
    scans: (shipment.Scans || []).map(s => ({
      status: s.ScanDetail?.Scan,
      location: s.ScanDetail?.ScannedLocation,
      dateTime: s.ScanDetail?.StatusDateTime
    }))
  };
}

module.exports = { trackShipment };
