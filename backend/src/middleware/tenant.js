/**
 * Layer 3: Tenant Authorization
 *
 * This is the MOST IMPORTANT middleware in a multi-tenant system.
 * It guarantees a user can NEVER read/write another society's data —
 * even if they manually change an :id in the URL or request body.
 *
 * How it works:
 * - super_admin: allowed to act across societies (req.societyId stays flexible,
 *   taken from a query param /body if provided, otherwise null = "all")
 * - everyone else: req.societyId is FORCED to their own societyId from the JWT/user
 *   record — the client's input is never trusted for this value.
 */
export function scopeToTenant(req, res, next) {
  if (req.user.role === 'super_admin') {
    req.societyId = req.query.societyId || req.body.societyId || null;
    return next();
  }

  if (!req.user.societyId) {
    return res.status(403).json({ message: 'User has no associated society' });
  }

  // Overwrite — never trust societyId coming from the client for non-super-admins
  req.societyId = req.user.societyId;
  req.body.societyId = req.user.societyId;

  next();
}

/**
 * Layer 4: Resource Authorization
 * Use this AFTER fetching a specific document (e.g. a Complaint by :id)
 * to confirm it actually belongs to the caller's society before returning/modifying it.
 *
 * Example usage inside a controller:
 *   const complaint = await Complaint.findById(req.params.id);
 *   if (!belongsToTenant(complaint, req)) return res.status(404).json({ message: 'Not found' });
 */
export function belongsToTenant(doc, req) {
  if (req.user.role === 'super_admin') return true;
  if (!doc || !doc.societyId) return false;
  return doc.societyId.toString() === req.user.societyId.toString();
}
