import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
        },
        refreshToken: {
            type: String,
        }
    },
    {timestamps: true}
)

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.models.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.models.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.models.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)