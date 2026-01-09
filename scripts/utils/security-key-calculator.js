// Security Key Calculator for UDS Simulator
// This demonstrates how seed-key algorithms work

/**
 * Calculate security key from seed
 * NOTE: This is the algorithm used by the simulator
 * Real ECUs use proprietary, secret algorithms!
 */
function calculateSecurityKey(seed) {
    // Validate input
    if (!Array.isArray(seed) || seed.length !== 4) {
        throw new Error('Seed must be an array of 4 bytes');
    }

    // Secret XOR mask (this is what makes the algorithm "secret")
    // In real ECUs, this is protected and never revealed
    const SECRET_MASK = [0xA5, 0x5A, 0xF0, 0x0F];

    // Calculate key by XORing seed with secret mask
    const key = seed.map((byte, index) => byte ^ SECRET_MASK[index]);

    return key;
}

// Example usage:
console.log('=== UDS Security Key Calculator ===\n');

// Test with simulator seed
const testSeed = [0x12, 0x34, 0x56, 0x78];
const calculatedKey = calculateSecurityKey(testSeed);

console.log('Seed (from ECU):');
console.log('  Hex:', testSeed.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
console.log('  Decimal:', testSeed.join(' '));

console.log('\nCalculated Key:');
console.log('  Hex:', calculatedKey.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
console.log('  Decimal:', calculatedKey.join(' '));

console.log('\nUDS Command:');
console.log('  27 02', calculatedKey.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '));

console.log('\n=== Calculation Details ===');
for (let i = 0; i < testSeed.length; i++) {
    const seed = testSeed[i];
    const secret = [0xA5, 0x5A, 0xF0, 0x0F][i];
    const key = calculatedKey[i];

    console.log(`Byte ${i}: 0x${seed.toString(16).toUpperCase()} XOR 0x${secret.toString(16).toUpperCase()} = 0x${key.toString(16).toUpperCase()}`);
    console.log(`        ${seed.toString(2).padStart(8, '0')} XOR ${secret.toString(2).padStart(8, '0')} = ${key.toString(2).padStart(8, '0')}`);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateSecurityKey };
}
