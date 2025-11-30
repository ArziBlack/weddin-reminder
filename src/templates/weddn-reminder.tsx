/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Send,
  CheckCircle,
  XCircle,
  Loader,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

export default function WhatsAppSender() {
  const [formData, setFormData] = useState({
    coupleName: "Ademola & Motunrayo",
    weddingDate: "December 6 2025",
    colors: "Red & Yellow",
    websiteUrl: "www.weddn.co/w/shs6dd",
    giftingDetails: "Moniepoint (8134761606) Egbeyemi Ridwan",
    lastName: "Egbeyemi",
  });

  const [selectedTemplate, setSelectedTemplate] = useState<
    "wedding" | "hello_world" | "freeform"
  >("wedding");
  const [freeformMessage, setFreeformMessage] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneList, setPhoneList] = useState<string[]>([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [sendResults, setSendResults] = useState<{
    success: string[];
    failed: { phone: string; error: any }[];
  } | null>(null);

  const CREDENTIALS = {
    WABA_ID: "1334188511363110",
    PHONE_NUMBER_ID: "864458856753610",
    VERSION: "v22.0",
    ACCESS_TOKEN:
      "EAAWjW3ToxpMBQBI3gVs656hBolOposvAnGrUt0rQZA0PezSnZBI5APZCtx7okZCcrwjmV7D7HPbPfhbvZBFsQlEVMxJFZBpvljHEGXiEg8t17NFweTskOP8zzOIvmv6dTKgcj6um2KT6rIJecoiYR40dZCgqNcxQEWB6ORxAPNIP1iFSXZC1nsrOAy8GhYKFI16pQwZDZD",
    TEMPLATE_ID: "1530498451546073",
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatPhoneNumber = (phone: any) => {
    let cleaned = phone.replace(/\D/g, "");

    // If number already has a country code (length > 10), don't add another
    if (cleaned.length > 11) {
      return cleaned;
    }

    // Only add country code for Nigerian numbers without one
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.substring(1);
    } else if (!cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }

    return cleaned;
  };

  const addPhoneNumber = () => {
    if (!phoneInput.trim()) {
      setStatus({ type: "error", message: "Please enter a phone number" });
      return;
    }

    const formatted = formatPhoneNumber(phoneInput);

    if (phoneList.includes(formatted)) {
      setStatus({
        type: "error",
        message: "This number is already in the list",
      });
      return;
    }

    setPhoneList((prev) => [...prev, formatted]);
    setPhoneInput("");
    setStatus({ type: "success", message: `Added ${formatted} to the list` });
  };

  const removePhoneNumber = (phone: any) => {
    setPhoneList((prev) => prev.filter((p) => p !== phone));
    setStatus({ type: "success", message: "Number removed from list" });
  };

  const clearAllNumbers = () => {
    setPhoneList([]);
    setStatus({ type: "success", message: "All numbers cleared" });
  };

  const sendWhatsAppMessage = async (phoneNumber: any) => {
    const url = `https://graph.facebook.com/${CREDENTIALS.VERSION}/${CREDENTIALS.PHONE_NUMBER_ID}/messages`;

    let payload;

    if (selectedTemplate === "freeform") {
      payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: freeformMessage,
        },
      };
    } else if (selectedTemplate === "hello_world") {
      payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: "weddn_invite_v2",
          language: {
            code: "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: formData.coupleName },
                { type: "text", text: formData.weddingDate },
                { type: "text", text: formData.colors },
                { type: "text", text: formData.websiteUrl },
                { type: "text", text: formData.giftingDetails },
                { type: "text", text: formData.lastName },
              ],
            },
          ],
        },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CREDENTIALS.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send message");
    }

    return data;
  };

  const sendToAllNumbers = async () => {
    if (phoneList.length === 0) {
      setStatus({
        type: "error",
        message: "Please add phone numbers to the list first",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });
    setSendingProgress({ current: 0, total: phoneList.length });

    const results: {
      success: string[];
      failed: { phone: string; error: any }[];
    } = {
      success: [],
      failed: [],
    };

    const BATCH_SIZE = 20;
    const BATCH_DELAY = 20000; // 20 seconds

    for (let i = 0; i < phoneList.length; i++) {
      const phone = phoneList[i];
      setSendingProgress({ current: i + 1, total: phoneList.length });

      try {
        await sendWhatsAppMessage(phone);
        results.success.push(phone);

        // Add delay between messages within a batch
        if (i < phoneList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Add 20s delay after every 20 messages
        if ((i + 1) % BATCH_SIZE === 0 && i < phoneList.length - 1) {
          setStatus({
            type: "success",
            message: `Sent ${
              i + 1
            } messages. Waiting 20 seconds before next batch...`,
          });
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
        }
      } catch (error) {
        results.failed.push({
          phone,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setLoading(false);
    setSendResults(results);

    if (results.failed.length === 0) {
      setStatus({
        type: "success",
        message: `Successfully sent messages to all ${results.success.length} numbers! 🎉`,
      });
      setPhoneList([]);
    } else {
      setStatus({
        type: "error",
        message: `Sent to ${results.success.length} numbers. Failed: ${
          results.failed.length
        } (${results.failed.map((f) => f.phone).join(", ")})`,
      });
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      addPhoneNumber();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Wedding Invite Sender
              </h1>
              <p className="text-gray-600">
                Send personalized WhatsApp invitations to multiple guests
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTemplate("wedding")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTemplate === "wedding"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Wedding Invite
              </button>
              <button
                onClick={() => setSelectedTemplate("hello_world")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTemplate === "hello_world"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Hello World (Test)
              </button>
              <button
                onClick={() => setSelectedTemplate("freeform")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTemplate === "freeform"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Free-form Message
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Template Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Template Settings
              </h2>

              {selectedTemplate === "wedding" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couple Names
                    </label>
                    <input
                      type="text"
                      name="coupleName"
                      value={formData.coupleName}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Date
                    </label>
                    <input
                      type="text"
                      name="weddingDate"
                      value={formData.weddingDate}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors of the Day
                    </label>
                    <input
                      type="text"
                      name="colors"
                      value={formData.colors}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wedding Website URL
                    </label>
                    <input
                      type="text"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gifting Details
                    </label>
                    <input
                      type="text"
                      name="giftingDetails"
                      value={formData.giftingDetails}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange(e.target)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              ) : selectedTemplate === "freeform" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={freeformMessage}
                    onChange={(e) => setFreeformMessage(e.target.value)}
                    placeholder="Type your custom message here..."
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Free-form messages can only be sent to users who have
                    messaged your business in the last 24 hours.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    The Hello World template is a simple test message with no
                    customizable parameters.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Phone Number List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recipients List
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{phoneList.length} numbers</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., 08012345678"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={addPhoneNumber}
                    className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or click + to add
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {phoneList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No numbers added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {phoneList.map((phone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-mono text-gray-700">
                          +{phone}
                        </span>
                        <button
                          onClick={() => removePhoneNumber(phone)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {phoneList.length > 0 && (
                <button
                  onClick={clearAllNumbers}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
                >
                  Clear All Numbers
                </button>
              )}
            </div>
          </div>

          {status.message && (
            <div
              className={`mt-6 flex items-center gap-2 p-4 rounded-lg ${
                status.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          {loading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Sending messages... {sendingProgress.current} of{" "}
                  {sendingProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (sendingProgress.current / sendingProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            onClick={sendToAllNumbers}
            disabled={loading || phoneList.length === 0}
            className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sending Messages...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send to All {phoneList.length} Recipients
              </>
            )}
          </button>

          {sendResults && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📊 Sending Results
                </h3>
                <button
                  onClick={() => setSendResults(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Results
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      Successful: {sendResults.success.length}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">
                      Failed: {sendResults.failed.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sendResults.success.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 mb-2">
                      ✅ Successful Sends
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {sendResults.success.map((phone, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="font-mono text-green-700">
                            +{phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sendResults.failed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-2">
                      ❌ Failed Sends
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {sendResults.failed.map((item, index) => (
                        <div
                          key={index}
                          className="p-2 bg-red-50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span className="font-mono text-red-700">
                              +{item.phone}
                            </span>
                          </div>
                          <p className="text-xs text-red-600 ml-6">
                            Error: {item.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              📝 Message Preview
            </h3>
            {selectedTemplate === "wedding" ? (
              <p className="text-xs text-blue-700 whitespace-pre-line font-mono">
                {`Message from ${formData.coupleName}

💍✨ One Week to Go! ✨💍

We can't wait to celebrate with you on ${formData.weddingDate}. Thank you for your love, support, and prayers.

Your personalised QR access codes will be sent soon and will be required for entry. Please keep an eye out for that.

Colours of the Day: ${formData.colors}

For full wedding information, please visit: ${formData.websiteUrl}

If you would like to bless us with a monetary gift, our details are below (also available on the website by the gifting tab): ${formData.giftingDetails}

With love,
The future ${formData.lastName}s`}
              </p>
            ) : selectedTemplate === "freeform" ? (
              <p className="text-xs text-blue-700 whitespace-pre-line font-mono">
                {freeformMessage || "Your custom message will appear here..."}
              </p>
            ) : (
              <p className="text-xs text-blue-700 whitespace-pre-line font-mono">
                {`Hello World

Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.

WhatsApp Business Platform sample message`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
