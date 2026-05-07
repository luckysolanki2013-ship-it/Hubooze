# Hubooze API Reference

Base URL: `http://localhost:3000/api`

## Auth Header
```
Authorization: Bearer <token>
```

## Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | No | Register user |
| POST | /login | No | Login → JWT |
| POST | /send-otp | No | Send OTP |
| POST | /verify-otp | No | Verify OTP → JWT |
| GET | /me | Yes | My profile |
| PUT | /profile | Yes | Update profile |
| POST | /addresses | Yes | Add address |

### Products `/api/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | No | List (search, filter, paginate) |
| GET | /:id | No | Single product |
| POST | / | Seller | Create |
| PUT | /:id | Seller | Update |
| POST | /:id/reviews | Yes | Add review |

### Orders `/api/orders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | My orders |
| POST | / | Yes | Place order |
| PATCH | /:id/cancel | Yes | Cancel |
| PATCH | /:id/status | Seller | Update status |
| POST | /validate-coupon | Yes | Check coupon |

### Returns `/api/returns`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | My returns |
| POST | / | Yes | Initiate |
| PATCH | /:id/approve | Seller | Approve |
| PATCH | /:id/reject | Seller | Reject |

### Seller `/api/seller`
| GET | /dashboard | Seller | Stats |
| GET | /products | Seller | Products |
| GET | /orders | Seller | Orders |
| GET | /payouts | Seller | Payout info |

### Admin `/api/admin`
| GET | /stats | Admin | Platform stats |
| GET | /users | Admin | All users |
| PATCH | /users/:id/role | Admin | Change role |
| GET | /analytics | Admin | Revenue data |

## Coupon Codes
| Code | Type | Value | Min |
|------|------|-------|-----|
| SAVE10 | percent | 10% | - |
| FLAT50 | flat | ₹50 | ₹299 |
| ECO20 | percent | 20% | - |
| FIRST | percent | 15% | - |
| HUBOOZE | flat | ₹100 | ₹499 |
