const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Initialize Razorpay
// ⚠️ IMPORTANT: Make sure this Key Secret is correct!
const razorpay = new Razorpay({
  key_id: "rzp_test_RoMYE85wG1Vzew", 
  key_secret: "2DACsLl2sqveLX7ypGcmqn9S" // <--- PASTE YOUR SECRET KEY HERE
});

// 1. Payment Function (The new one)
exports.createOrder = functions.https.onCall(async (data, context) => {
  // We allow public access for now to fix the 401 error, 
  // but we check auth inside.
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const amount = data.amount;
  const options = {
    amount: amount,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      key: razorpay.key_id
    };
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// 2. Send Password Reset (Restored)
exports.sendPasswordReset = functions.https.onCall(async (data, context) => {
  const email = data.email;
  try {
      const link = await admin.auth().generatePasswordResetLink(email);
      return { success: true, message: "Reset link generated" };
  } catch (error) {
      throw new functions.https.HttpsError('internal', error.message);
  }
});

// 3. Verify Payment (Restored)
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  const { orderId, paymentId, signature } = data;
  const generated_signature = crypto.createHmac('sha256', razorpay.key_secret)
                                  .update(orderId + "|" + paymentId)
                                  .digest('hex');

  if (generated_signature === signature) {
      return { status: "success", paymentId };
  } else {
      throw new functions.https.HttpsError('invalid-argument', 'Signature verification failed');
  }
});

// 4. Track Action (Restored)
exports.trackAction = functions.https.onCall(async (data, context) => {
    return { success: true };
});