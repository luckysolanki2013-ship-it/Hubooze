const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "hubooze_secret";

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
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

    const existing = await userRepository.findByEmail(email);

    if (existing) {
        throw new Error("Email already exists.");
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

    return {
        token: generateToken(user),
        user
    };
}

async function login(email, password) {

    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid email or password.");
    }

    return {
        token: generateToken(user),
        user
    };
}

module.exports = {
    register,
    login,
    generateToken
};