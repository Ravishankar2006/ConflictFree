const toTimeStr = (d) => typeof d === 'string' ? d : `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
const toTimeShort = (d) => toTimeStr(d).slice(0, 5);

const timeToDate = (t) => {
  if (!t || typeof t === 'object') return t;
  const [h, m, s = '00'] = t.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, s));
};

export { toTimeStr, toTimeShort, timeToDate };
