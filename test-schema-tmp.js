const { hasHearseColumn, getHearseColumns } = require('./services/hearse-service/dist/services/hearse-service/utilities/hearseSchema');
(async () => {
  try {
    const cols = await getHearseColumns();
    console.log('COLUMNS:', Array.from(cols).sort().join(', '));
    console.log('hasFuelCard:', await hasHearseColumn('fuel_card_number'));
    console.log('hasNope:', await hasHearseColumn('nope_column'));
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
  process.exit(0);
})();
