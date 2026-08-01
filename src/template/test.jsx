import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import apiClient from './api';

const metricsConfig = {
    // ── Soft-skill aggregates (Strength card + relative sentence) ──
    Clarity: [
        { level: "Low",    min: 0,  max: 50,  comments: ["Your message is hard to follow", "Ideas are not clearly connected", "Key points lack clarity", "Your pitch lacks flow"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Structure is decent but can improve", "Some points are clear", "Communication is reasonable", "Clarity is inconsistent"] },
        { level: "High",   min: 66, max: 100, comments: ["Well structured and easy to follow", "Ideas are clearly presented", "Strong concise communication", "Excellent clarity"] },
    ],
    Confidence: [
        { level: "Low",    min: 0,  max: 50,  comments: ["Delivery feels hesitant", "Posture reduces impact", "You seem unsure", "Confidence needs improvement"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Confidence is moderate", "Shows confidence in parts", "Stable but improvable", "Decent overall"] },
        { level: "High",   min: 66, max: 100, comments: ["Strong presence on camera", "Delivery feels assured", "Engaging delivery", "Excellent presence"] },
    ],
    Authenticity: [
        { level: "Low",    min: 0,  max: 50,  comments: ["Less natural than most candidates", "Lacks personal connect", "Feels rehearsed", "Limited genuineness"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Somewhat natural delivery", "Partially authentic", "Moderate personal connect", "Needs more authenticity"] },
        { level: "High",   min: 66, max: 100, comments: ["Natural and real delivery", "Strong personal connect", "Highly authentic", "Sincere communication"] },
    ],
    EQ: [
        { level: "Low",    min: 0,  max: 50,  comments: ["Self-focused pitch", "Low emotional awareness", "No collaboration examples", "Low people-connect"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Some team awareness", "Mentions collaboration", "Moderate EQ", "Needs more people impact"] },
        { level: "High",   min: 66, max: 100, comments: ["Strong team awareness", "Clear collaboration", "High emotional intelligence", "Strong people-connect"] },
    ],
    // ── Individual metrics (4-tile grid, Filler Words excluded) ──
    "Speech Rate": [
        { level: "Low",    min: 0,  max: 50,  comments: ["You are speaking too slowly", "Your delivery feels stretched", "Speech pace reduces engagement", "You may lose listener attention"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Your speaking pace is balanced", "Your speed is comfortable to follow", "Speech rate is moderate", "Mostly well-paced delivery"] },
        { level: "High",   min: 66, max: 100, comments: ["You are speaking too fast", "Your delivery feels rushed", "Important points may be missed", "Slow down slightly for better impact"] },
    ],
    "Eye Contact": [
        { level: "Low",    min: 0,  max: 50,  comments: ["You rarely maintain eye contact", "Frequent gaze away from camera", "Reduces confidence perception", "Looks disengaged"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Eye contact is moderate", "You maintain focus intermittently", "Some distractions in gaze", "Can be more consistent"] },
        { level: "High",   min: 66, max: 100, comments: ["Strong eye contact maintained", "You appear engaged and confident", "Consistent camera focus", "Excellent visual connection"] },
    ],
    "Smile": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Limited or no smile detected", "You appear serious throughout", "Reduces warmth", "Less engaging expression"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Occasional smile observed", "Some warmth in expression", "Moderate engagement", "Can be more expressive"] },
        { level: "High",   min: 66, max: 100, comments: ["Good smile throughout", "You appear warm and approachable", "Positive facial expression", "Highly engaging presence"] },
    ],
    "Energy": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Low energy delivery", "You sound flat or dull", "Engagement is low", "Needs more enthusiasm"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Moderate energy level", "Some engagement in delivery", "Energy varies across pitch", "Can be more dynamic"] },
        { level: "High",   min: 66, max: 100, comments: ["High energy and engaging", "You sound enthusiastic", "Strong presence and impact", "Excellent energy levels"] },
    ],
    "Tone Variation": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Your tone is monotone", "Limited variation in voice", "Delivery feels flat", "Needs vocal modulation"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Some variation in tone", "Voice modulation is moderate", "Can improve expressiveness", "Balanced tone usage"] },
        { level: "High",   min: 66, max: 100, comments: ["Good variation in tone", "Expressive voice delivery", "Highly engaging tone", "Excellent voice dynamics"] },
    ],
    "Articulation": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Words are not clearly pronounced", "Speech is difficult to understand", "Needs clearer articulation", "Mumbling detected"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Most words are clear", "Minor clarity issues", "Generally understandable", "Can improve pronunciation"] },
        { level: "High",   min: 66, max: 100, comments: ["Clear and crisp speech", "Easy to understand", "Strong pronunciation", "Excellent articulation"] },
    ],
    "Emotion": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Limited emotional expression", "You appear neutral throughout", "Lacks engagement", "Low expressiveness"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Some emotional variation", "Occasional engagement", "Moderate expression", "Balanced but not strong"] },
        { level: "High",   min: 66, max: 100, comments: ["Strong emotional expression", "Engaging and expressive", "Good variation in delivery", "Excellent expressiveness"] },
    ],
    "Pitch (Voice)": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Voice pitch is too low or flat", "May sound dull", "Needs variation", "Low vocal energy"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Pitch is stable", "Some variation present", "Moderately engaging voice", "Balanced delivery"] },
        { level: "High",   min: 66, max: 100, comments: ["Good pitch variation", "Engaging voice tone", "Dynamic vocal delivery", "Highly engaging voice"] },
    ],
    "Pause Rate": [
        { level: "Low",    min: 0,  max: 50,  comments: ["Very few pauses detected", "Delivery feels rushed", "No breathing space between points", "Hard to process content"] },
        { level: "Medium", min: 51, max: 65,  comments: ["Some pauses present", "Flow is mostly balanced", "Occasional breathing space", "Can improve pacing"] },
        { level: "High",   min: 66, max: 100, comments: ["Natural pausing rhythm", "Well-paced delivery", "Good use of strategic pauses", "Excellent pacing control"] },
    ],
};

// Deterministic comment pick — seed from videoId so text is stable per video
const getMetricFeedback = (name, score, seed = 0, seedOffset = 0, forcePositive = false) => {
    const config = metricsConfig[name] || metricsConfig["Articulation"];
    let levelObj;
    if (forcePositive) {
        levelObj = config[2] || config[1];
    } else {
        levelObj = config.find(l => score >= l.min && score <= l.max) || config[1];
    }
    const commentIdx = Math.abs(seed + seedOffset) % levelObj.comments.length;
    return {
        level: levelObj.level,
        description: levelObj.comments[commentIdx],
        color: levelObj.level === "High" ? "#22C55E" : levelObj.level === "Medium" ? "#F59E0B" : "#EF4444",
    };
};

const headlineTable = [
    {
        primary: "Clarity", secondary: "Confidence", weakness: "EQ",
        options: [
            "Clear and Confident Communicator, Building People Signals",
            "Structured and Assured Speaker with Growing EQ",
            "Strong Clarity and Confidence, Improving People Impact",
            "Clear Thinker with Confident Delivery, Building EQ",
            "Sharp Communicator with Emerging People Awareness",
        ]
    },
    {
        primary: "Confidence", secondary: "Energy", weakness: "Clarity",
        options: [
            "Confident and Energetic Speaker with Strong Clarity",
            "High Presence and Energy, Communicating Clearly",
            "Assertive and Engaging, Building Structured Clarity",
            "Strong Confidence with Dynamic Energy and Clear Delivery",
            "Engaging Speaker with High Confidence and Improving Structure",
        ]
    },
    {
        primary: "Authenticity", secondary: "Clarity", weakness: "Confidence",
        options: [
            "Authentic and Clear Communicator, Building Confidence",
            "Genuine Speaker with Strong Clarity, Improving Presence",
            "Natural and Structured, Growing Confidence",
            "Sincere Communicator with Clear Thinking, Building Confidence",
            "Authentic Delivery with Strong Clarity and Emerging Confidence",
        ]
    },
    {
        primary: "Energy", secondary: "Confidence", weakness: "Pause Rate",
        options: [
            "High Energy and Confidence, Improve Pacing Control",
            "Dynamic and Confident, Balance Your Pauses",
            "Strong Presence with Energy, Smoothen Delivery Flow",
            "Energetic Communicator, Improve Pause Balance",
            "Engaging and Confident, Refine Your Delivery Rhythm",
        ]
    },
];

const selectHeadline = (scores, weaknessName, seed) => {
    const allMetrics = [
        { name: "Clarity",      score: scores.clarity },
        { name: "Confidence",   score: scores.confidence },
        { name: "Authenticity", score: scores.authenticity },
        { name: "EQ",           score: scores.eq },
        { name: "Energy",       score: scores.energy },
        { name: "Pause Rate",   score: scores.pauseRate },
    ];
    const sorted  = [...allMetrics].sort((a, b) => b.score - a.score);
    const primary = sorted[0].name;
    const secondary = sorted[1].name;
    let matched = headlineTable.find(r => r.primary === primary && r.secondary === secondary && r.weakness === weaknessName);
    if (!matched) matched = headlineTable.find(r => r.primary === primary) || headlineTable[0];
    return matched.options[Math.abs(seed) % matched.options.length];
};

// Comment 1 relative sentence — skill-specific language from Attributes_Full
const getComment1 = (name, score, percentile) => {
    const level = score <= 50 ? "Low" : score <= 65 ? "Medium" : "High";
    const map = {
        Clarity:      { Low: `You sound less structured than ${percentile}% of candidates`,    Medium: `You are clearer than ${percentile}% of candidates`,           High: `You are clearer than ${percentile}% of candidates` },
        Confidence:   { Low: `You appear less confident than ${percentile}% of candidates`,    Medium: `You appear more confident than ${percentile}% of candidates`, High: `You appear more confident than ${percentile}% of candidates` },
        Authenticity: { Low: "Pitch feels scripted",                                            Medium: `You sound genuine to ${percentile}% of candidates`,           High: `You sound more genuine than ${percentile}% of candidates` },
        EQ:           { Low: "Lacks team signals",                                              Medium: `You show better EQ than ${percentile}% of candidates`,        High: `You show better EQ than ${percentile}% of candidates` },
    };
    const text = map[name]?.[level] || `Your ${name} is better than ${percentile}% of candidates`;
    return (level !== "Low" ? "✔ " : "⚠ ") + text;
};

export default function FeedbackScreen({ route, navigation }) {
    const [vId, setVId]         = useState(route?.params?.videoId);
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState({ total: null, speech: null, facial: null, video: null, percentile: 0 });

    useEffect(() => {
        const checkVideoId = async () => {
            if (!vId) {
                const storedId = await AsyncStorage.getItem("videoId");
                if (storedId) setVId(storedId);
                else setLoading(false);
            }
        };
        checkVideoId();
    }, [route?.params?.videoId]);

    const fetchData = async () => {
        try {
            const [totalRes, speechRes, facialRes, videoRes, percentileRes] = await Promise.allSettled([
                apiClient.get(`api/totalscore/video/${vId}`),
                apiClient.get(`api/scores/video/${vId}`),
                apiClient.get(`api/facial-score/video/${vId}`),
                apiClient.get(`api/videos/${vId}`),
                apiClient.get(`api/totalscore/video/${vId}/percentile`),
            ]);

            const pData = percentileRes.status === 'fulfilled' ? (percentileRes.value.data || 0) : 0;
            const finalPercentile = typeof pData === 'object' ? (pData.percentile || Object.values(pData)[0] || 0) : pData;

            setData({
                total:      totalRes.status      === 'fulfilled' ? totalRes.value.data      : null,
                speech:     speechRes.status     === 'fulfilled' ? speechRes.value.data     : null,
                facial:     facialRes.status     === 'fulfilled' ? facialRes.value.data     : null,
                video:      videoRes.status      === 'fulfilled' ? videoRes.value.data      : null,
                percentile: finalPercentile,
            });
        } catch (err) {
            console.log("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (vId) fetchData(); }, [vId]);

    if (!vId && !loading) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No video ID found in params or storage.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    const getScore = (val) => { const n = Number(val); return isNaN(n) ? 0 : n; };

    // Stable seed per video — text never changes on re-open
    const seed = parseInt(String(vId)) || 0;
    const seededPick = (arr, offset = 0) => arr[Math.abs(seed + offset) % arr.length];

    // ── Soft-skill aggregates (relative comparison for headline + percentile) ──
    const scores = {
        clarity:      getScore(data.total?.clarityScore)      * 50,
        confidence:   getScore(data.total?.confidenceScore)   * 50,
        authenticity: getScore(data.total?.authenticityScore) * 50,
        eq:           getScore(data.total?.emotionalScore)    * 50,
        energy:       Math.min(100, (getScore(data.speech?.energyScore) - 1.0) * 100),
        pauseRate:    Math.min(100, (getScore(data.speech?.sentenceStructureScore) - 1.0) * 100),
    };

    // ── Individual metrics for 4-tile grid ──
    // Normalisations per actual backend ranges:
    //   speechRate / articulation  : 0–2.0  → * 50
    //   pitch / energy / tone / emotion : 1.0–2.0 → (x-1)*100
    //   eyeContact : 0–2.5 → * 40
    //   smile      : 0–1.0 → * 100
    //   pauseRate (sentenceStructureScore) : 1.0–2.0 → (x-1)*100, only shown if >0 (new videos)
    const allPotentialMetrics = [
        data.speech?.speechRateScore   !== undefined && { title: "Speech Rate",    icon: "mic",       score: Math.min(100, getScore(data.speech.speechRateScore) * 50) },
        data.speech?.articulationScore !== undefined && { title: "Articulation",   icon: "edit-2",    score: Math.min(100, getScore(data.speech.articulationScore) * 50) },
        data.speech?.energyScore       !== undefined && { title: "Energy",         icon: "zap",       score: Math.min(100, (getScore(data.speech.energyScore) - 1.0) * 100) },
        data.speech?.toneScore         !== undefined && { title: "Tone Variation", icon: "music",     score: Math.min(100, (getScore(data.speech.toneScore) - 1.0) * 100) },
        data.speech?.pitchScore        !== undefined && { title: "Pitch (Voice)",  icon: "bar-chart", score: Math.min(100, (getScore(data.speech.pitchScore) - 1.0) * 100) },
        data.speech?.emotionScore      !== undefined && { title: "Emotion",        icon: "sun",       score: Math.min(100, (getScore(data.speech.emotionScore) - 1.0) * 100) },
        data.facial?.eyeContactScore   !== undefined && { title: "Eye Contact",    icon: "eye",       score: Math.min(100, getScore(data.facial.eyeContactScore) * 40) },
        data.facial?.smileScore        !== undefined && { title: "Smile",          icon: "smile",     score: Math.min(100, getScore(data.facial.smileScore) * 100) },
        (data.speech?.sentenceStructureScore !== undefined && getScore(data.speech.sentenceStructureScore) > 0) && {
            title: "Pause Rate", icon: "clock", score: Math.min(100, (getScore(data.speech.sentenceStructureScore) - 1.0) * 100),
        },
    ].filter(Boolean);

    // ── 2 worst + 2 best tiles ──
    const sorted   = [...allPotentialMetrics].sort((a, b) => a.score - b.score);
    const worstTwo = sorted.slice(0, 2);
    const bestTwo  = sorted.slice(-2).reverse();

    const displayMetrics = [
        ...worstTwo.map((m, i) => ({ ...m, ...getMetricFeedback(m.title, m.score, seed, i) })),
        ...bestTwo.map((m, i)  => ({ ...m, ...getMetricFeedback(m.title, m.score, seed, i + 2) })),
    ];

    // ── Top soft skill for percentile line ──
    const softSkills = [
        { name: "Clarity",      score: scores.clarity },
        { name: "Confidence",   score: scores.confidence },
        { name: "Authenticity", score: scores.authenticity },
        { name: "EQ",           score: scores.eq },
    ].sort((a, b) => b.score - a.score);
    const topSkill = softSkills[0];

    // ── Strength / Gap bottom cards ──
    const strengthCard = { title: topSkill.name, ...getMetricFeedback(topSkill.name, topSkill.score, seed, 5, true) };
    const gapMetric    = worstTwo[0] || { title: "Growth Area", score: 0, description: "Continue practicing." };
    const gapCard      = { ...gapMetric, ...getMetricFeedback(gapMetric.title, gapMetric.score, seed, 6) };

    // ── Headlines ──
    const headline     = selectHeadline(scores, gapMetric.title, seed) || "Analyzing your performance...";
    const originalPercentile = data.percentile || Math.round(getScore(data.total?.totalScore) * 10);
    const percentileText     = getComment1(topSkill.name, topSkill.score, originalPercentile);
    const gapText            = `⚠ Biggest Gap: ${gapMetric.title} is your main area for growth.`;

    // ── Insight paragraph ──
    const insightBest  = bestTwo[0]?.title  || topSkill.name;
    const insightWorst = worstTwo[0]?.title || "this area";
    const insightTemplates = [
        `During this session, your ${insightBest} stood out significantly. Balancing this with improved ${insightWorst} will elevate your professional presence.`,
        `You project strong ${insightBest}, which is a vital asset. Refining your ${insightWorst} should be your primary focus next.`,
        `The most impressive aspect of your delivery was your ${insightBest}. We've identified ${insightWorst} as your biggest opportunity for growth.`,
        `Your naturally high ${insightBest} creates a positive impression. Improving ${insightWorst} will result in a much more balanced delivery.`,
        `With strong ${insightBest}, you've built a solid foundation. Sharpening your ${insightWorst} is the final piece of the puzzle.`,
    ];
    const insightText = seededPick(insightTemplates, 10);

    // ── Checklist from worst metrics' comment pools ──
    const getChecklistItem = (metric, offset) => {
        if (!metric) return "Record your next attempt in a quiet, well-lit environment";
        const config   = metricsConfig[metric.title];
        const levelObj = config?.find(l => metric.score >= l.min && metric.score <= l.max) || config?.[0];
        return seededPick(levelObj?.comments || ["Practice this area"], offset);
    };
    const checkList = [
        getChecklistItem(worstTwo[0], 20),
        getChecklistItem(worstTwo[1], 21),
        "Record your next attempt in a quiet, well-lit environment",
    ];

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Review</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>

                <Text style={styles.headline}>{headline}</Text>
                <Text style={styles.percentile}>{percentileText}</Text>
                <Text style={styles.gap}>{gapText}</Text>

                {/* 4-TILE GRID — 2 worst (red/yellow) then 2 best (green) */}
                <View style={styles.grid}>
                    {displayMetrics.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Icon name={item.icon} size={18} color="#fff" />
                                <Text style={styles.cardTitle}>{item.title}</Text>
                            </View>
                            <View style={[styles.tag, { backgroundColor: item.color }]}>
                                <Text style={styles.tagText}>{item.level}</Text>
                            </View>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                    ))}
                </View>

                {/* HOW YOU CAME ACROSS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🪞 How you came across</Text>
                    <Text style={styles.sectionText}>{insightText}</Text>
                </View>

                {/* STRENGTH + GAP */}
                <View style={styles.row}>
                    <View style={styles.strengthCard}>
                        <Text style={styles.strengthTitle}>🟢 Strongest: {strengthCard.title}</Text>
                        <Text style={styles.strengthText}>{strengthCard.description}</Text>
                    </View>
                    <View style={styles.gapCard}>
                        <Text style={styles.gapTitle}>🔴 Improve: {gapCard.title}</Text>
                        <Text style={styles.gapText}>{gapCard.description}</Text>
                    </View>
                </View>

                {/* CHECKLIST */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Improve your next attempt</Text>
                    {checkList.map((item, i) => (
                        <View key={i} style={styles.checkItem}>
                            <View style={styles.checkbox} />
                            <Text style={styles.checkText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F172A",
        padding: 16,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 60,
    },
    loader:         { flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" },
    errorContainer: { flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center", padding: 20 },
    errorText:      { color: "#EF4444", textAlign: "center" },
    headerRow:      { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", justifyContent: "center", alignItems: "center" },
    headerTitle:    { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 12 },
    headline:       { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 12, lineHeight: 28 },
    percentile:     { color: "#9CA3AF", marginBottom: 8 },
    gap:            { color: "#F59E0B", marginBottom: 16 },
    grid:           { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    card:           { width: "48%", backgroundColor: "#1E293B", borderRadius: 12, padding: 12, marginBottom: 12 },
    cardHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    cardTitle:      { color: "#fff", marginLeft: 6, fontWeight: "600" },
    tag:            { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
    tagText:        { color: "#fff", fontSize: 12 },
    cardDesc:       { color: "#CBD5F5", fontSize: 12 },
    section:        { marginTop: 16, backgroundColor: "#1E293B", padding: 16, borderRadius: 12 },
    sectionTitle:   { color: "#fff", fontWeight: "bold", marginBottom: 8 },
    sectionText:    { color: "#CBD5F5" },
    row:            { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
    strengthCard:   { width: "48%", backgroundColor: "#052e16", padding: 12, borderRadius: 12 },
    gapCard:        { width: "48%", backgroundColor: "#3f1d1d", padding: 12, borderRadius: 12 },
    strengthTitle:  { color: "#22C55E", fontWeight: "bold", marginBottom: 4 },
    strengthText:   { color: "#D1FAE5" },
    gapTitle:       { color: "#EF4444", fontWeight: "bold", marginBottom: 4 },
    gapText:        { color: "#FECACA" },
    checkItem:      { flexDirection: "row", alignItems: "center", marginTop: 10 },
    checkbox:       { width: 18, height: 18, borderWidth: 1, borderColor: "#fff", marginRight: 10 },
    checkText:      { color: "#fff" },
});
