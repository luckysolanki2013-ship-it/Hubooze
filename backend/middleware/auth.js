const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

// Verify JWT token
exports.protect = async (req, res, next) => {
    try {

        const token = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                error: "Not authenticated. Please login."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await userRepository.findOne({
            id: decoded.id
        });

        // Support Mongo ObjectId tokens
        if (!user) {
            user = await userRepository.findOne({
                _id: decoded.id
            });
        }

        if (!user) {
            return res.status(401).json({
                error: "User not found."
            });
        }

        req.user = user;

        next();

    } catch (err) {

        return res.status(401).json({
            error: "Invalid or expired token."
        });

    }
};

// Seller
exports.sellerOnly = (req, res, next) => {

    if (
        req.user.role !== "seller" &&
        req.user.role !== "admin"
    ) {
        return res.status(403).json({
            error: "Seller access required."
        });
    }

    next();
};

// Admin
exports.adminOnly = (req, res, next) => {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            error: "Admin access required."
        });
    }

    next();
};

// Optional Authentication
exports.optionalAuth = async (req, res, next) => {

    try {

        const token = req.headers.authorization?.split(" ")[1];

        if (token) {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            let user = await userRepository.findOne({
                id: decoded.id
            });

            if (!user) {
                user = await userRepository.findOne({
                    _id: decoded.id
                });
            }

            req.user = user || null;
        }

    } catch (_) {}

    next();
};