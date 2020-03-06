export const calculateInfa = text => {
    let hash = parseInt(
        crypto
            .createHash("md5")
            .update(text)
            .digest("hex")
            .substring(0, 8),
        16
    );
    if (hash) {
        hash = ((hash % 1000) / 1000.0) * 1.2 - 0.1;
        if (hash < 0) hash = 0;
        if (hash > 1) hash = 1;
        hash = parseInt(hash * 100);
    }
    console.log("hash was " + hash);
    return "infa " + hash + "%";
};
