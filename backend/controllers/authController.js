const authService = require("../services/authService");

// Register
async function register(req, res) {
    try {
        const result = await authService.register(req.body);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token: result.token,
            user: result.user
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
}

// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        return res.json({
            success: true,
            message: "Login successful.",
            token: result.token,
            user: result.user
        });

    } catch (err) {
        return res.status(401).json({
            success: false,
            error: err.message
        });
    }
}

// Get Profile
async function me(req, res) {
    try {
        const user = await authService.getProfile(req.user.id || req.user._id);

        return res.json({
            success: true,
            user
        });

    } catch (err) {
        return res.status(404).json({
            success: false,
            error: err.message
        });
    }
}

// Update Profile
async function updateProfile(req, res) {
    try {
        const user = await authService.updateProfile(
            req.user.id || req.user._id,
            req.body
        );

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
}

module.exports = {
    register,
    login,
    me,
    updateProfile
};