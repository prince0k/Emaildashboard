if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Refusing to start.");
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRE || "1d",
  issuer: "email-core",
};
