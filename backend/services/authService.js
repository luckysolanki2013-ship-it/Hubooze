const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "hubooze_secret";

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id || user._id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}

// =========================
// REGISTER
// =========================

async function register(data) {

    const {
        name,
        email,
        password,
        phone,
        city,
        role
    } = data;

    if (!name || !email || !password) {
        throw new Error("Name, email and password are required.");
    }

    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }

    const existing = await userRepository.findByEmail(email);

    if (existing) {
        throw new Error("Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
        id: "u_" + Date.now(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || "",
        city: city || "",
        role: role === "seller" ? "seller" : "customer",
        addresses: [],
        wishlist: [],
        notifPrefs: {},
        createdAt: new Date()
    });

    delete user.password;

    return {
        token: generateToken(user),
        user
    };
}

// =========================
// LOGIN
// =========================

async function login(email, password) {

    if (!email || !password) {
        throw new Error("Email and password required.");
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid email or password.");
    }

    await userRepository.update(user.id || user._id, {
        lastLoginAt: new Date()
    });

    delete user.password;

    return {
        token: generateToken(user),
        user
    };
}

// =========================
// GET PROFILE
// =========================

async function getProfile(userId) {

    let user = await userRepository.findOne({
        id: userId
    });

    if (!user) {
        user = await userRepository.findOne({
            _id: userId
        });
    }

    if (!user) {
        throw new Error("User not found.");
    }

    delete user.password;
    delete user.otp;

    return user;
}

// =========================
// UPDATE PROFILE
// =========================

async function updateProfile(userId, data) {

    let user = await userRepository.findOne({
        id: userId
    });

    if (!user) {
        user = await userRepository.findOne({
            _id: userId
        });
    }

    if (!user) {
        throw new Error("User not found.");
    }

    const update = {};

    if (data.name !== undefined) {
        update.name = data.name.trim();
    }

    if (data.phone !== undefined) {
        update.phone = data.phone;
    }

    if (data.city !== undefined) {
        update.city = data.city;
    }

    if (data.businessName !== undefined) {
        update.businessName = data.businessName;
    }

    const updatedUser = await userRepository.update(
        user.id || user._id,
        update
    );

    delete updatedUser.password;
    delete updatedUser.otp;

    return updatedUser;
}
async function sendOTP(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error("No account found with this email.");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.otp = {
        code: otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    };

  await userRepository.update(
    user.id || user._id,
    {
        otp: user.otp
    }
);

    console.log(`🔐 OTP for ${email}: ${otp}`);

    return {
        message: "OTP sent successfully.",
        otp_dev: otp
    };
}

async function verifyOTP(email, otp) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error("User not found.");
    }

    if (!user.otp) {
        throw new Error("No OTP requested.");
    }

    if (Date.now() > user.otp.expiresAt) {
        throw new Error("OTP expired.");
    }

    if (user.otp.code !== String(otp)) {
        throw new Error("Invalid OTP.");
    }

   await userRepository.update(
    user.id || user._id,
    {
        otp: null
    }
);

const { password, otp: userOtp, ...safeUser } = user;

return {
    token: generateToken(user),
    user: safeUser
};
}

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    sendOTP,
    verifyOTP,
    generateToken
};