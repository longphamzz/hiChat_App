import mongoose from 'mongoose'

const callHistorySchema = new mongoose.Schema({
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    callType: { type: String, enum: ['voice','video'], required: true },
    status: { type: String, enum: ['missed','completed','rejected'], required: true },
    duration: { type: Number, default: 0 }, // seconds
    startedAt: { type: Date },
    endedAt: { type: Date },
}, { timestamps: true })

const CallHistory = mongoose.model('CallHistory', callHistorySchema)

export default CallHistory
