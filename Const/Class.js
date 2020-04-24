const STATE = {
    PREPARE: 'Prepare',
    JOIN_ABLE: 'Joinable',
    IN_PROGRESS: 'InProgress',
    ENDED: 'Ended'
}

const MIN_TUTEE = 2

module.exports = {
    state: STATE,
    MIN_TUTEE: MIN_TUTEE
};