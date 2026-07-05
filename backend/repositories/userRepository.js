const dba = require("../dbAdapter");

async function findOne(query) {
    return await dba.findUser(query);
}

async function findByEmail(email) {
    return findOne({
        email: email.toLowerCase()
    });
}

async function findById(id) {
    return findOne({
        id
    });
}

async function create(user) {
    return await dba.createUser(user);
}

async function update(id, data) {
    return await dba.updateUser(id, data);
}

module.exports = {
    findOne,
    findByEmail,
    findById,
    create,
    update
};