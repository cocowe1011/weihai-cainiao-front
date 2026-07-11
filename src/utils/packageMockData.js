/**
 * 将菜鸟大包接口 data 映射为内部包裹对象
 * 缺字段存空；smallPackageQuantity > 1 为大包，<= 1 为小包
 * @param {object} data 菜鸟接口 data
 * @param {string} barcode 扫码条码
 * @returns {object}
 */
export function mapCainiaoToPackage(data, barcode) {
  const code = (barcode || '').trim();
  const qty =
    data && data.smallPackageQuantity != null
      ? String(data.smallPackageQuantity)
      : '';
  const qtyNum = Number(qty);
  const packageSize = qtyNum > 1 ? 'large' : 'small';

  return {
    packageNo: (data && data.bigPackageCode) || code,
    packageSize,
    customerSource: '',
    packageCreateTime: '',
    sourceWarehouse: '',
    chargeWeight:
      data && data.standardWeight != null ? String(data.standardWeight) : '',
    packingWeight:
      data && data.packingWeight != null ? String(data.packingWeight) : '',
    expectedQty: qty,
    actualQty: qty,
    channel: (data && data.laneCode) || '',
    packageStatus: '',
    destinationCountry: '',
    departurePort: '',
    destinationPort: '',
    mblNo: '',
    subBillNo: '',
    businessNo: '',
    containerNo: '',
    sealNo: '',
    packingTime: '',
    packer: '',
    handoverTime: '',
    handoverPerson: '',
    customsPort: '',
    billReceiver: '',
    batchNo: '',
    plateNo: '',
    barcode: code
  };
}

/**
 * 根据扫码条码 mock 包裹信息（按菜鸟样例形态，固定返回大包）
 * @param {string} barcode
 * @returns {object}
 */
export function mockPackageByBarcode(barcode) {
  const code = (barcode || '').trim();
  return mapCainiaoToPackage(
    {
      bigPackageCode: code,
      standardWeight: '18147',
      grossWeight: '18070',
      netWeight: '17947',
      labelWeight: '18',
      packingWeight: '200',
      volume: null,
      volumeUnit: null,
      laneCode: 'L_AE_EXPRESS_SGSEA_KR_V2V',
      smallPackageQuantity: '18'
    },
    code
  );
}

/**
 * 包裹对象 → order_info 保存 payload
 * @param {object} pkg
 * @returns {object}
 */
export function toOrderInfoPayload(pkg) {
  return {
    invalidFlag: '0',
    trayStatus: '1',
    packageNo: pkg.packageNo,
    customerSource: pkg.customerSource,
    packageCreateTime: pkg.packageCreateTime,
    sourceWarehouse: pkg.sourceWarehouse,
    chargeWeight: pkg.chargeWeight,
    expectedQty: pkg.expectedQty,
    actualQty: pkg.actualQty,
    channel: pkg.channel,
    packageStatus: pkg.packageStatus,
    destinationCountry: pkg.destinationCountry,
    departurePort: pkg.departurePort,
    destinationPort: pkg.destinationPort,
    mblNo: pkg.mblNo,
    subBillNo: pkg.subBillNo,
    businessNo: pkg.businessNo,
    containerNo: pkg.containerNo,
    sealNo: pkg.sealNo,
    packingTime: pkg.packingTime,
    packer: pkg.packer,
    handoverTime: pkg.handoverTime,
    handoverPerson: pkg.handoverPerson,
    customsPort: pkg.customsPort,
    billReceiver: pkg.billReceiver,
    batchNo: pkg.batchNo,
    plateNo: pkg.plateNo
  };
}

/**
 * 包裹对象 → 左侧展示 / nowScanTrayInfo
 * @param {object} pkg
 * @returns {object}
 */
export function toScanDisplayInfo(pkg) {
  return {
    packageNo: pkg.packageNo,
    channel: pkg.channel,
    packingWeight: pkg.packingWeight,
    expectedQty: pkg.expectedQty
  };
}
