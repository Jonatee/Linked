const BaseRepository = require("../shared/base-repository");
const AuthSession = require("./auth-session.model");

class AuthRepository extends BaseRepository {
  constructor() {
    super(AuthSession);
  }

  revokeAllForUser(userId) {
    return this.model.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), modifiedAt: new Date() }
    );
  }
}

module.exports = new AuthRepository();

