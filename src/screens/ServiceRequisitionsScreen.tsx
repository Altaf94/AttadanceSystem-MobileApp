import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useFocusEffect } from '@react-navigation/native';
import { PrimaryButton, ScreenHeader, ScreenLayout } from '../components';
import { API_BASE_URL, COLORS } from '../constants';
import { fetchServiceRequisitions, approveServiceRequisition } from '../services/api';
import { getUser } from '../utils';
import { screenStyles } from '../theme/screenStyles';
import { RootStackParamList, ServiceRequisition } from '../types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ServiceRequisitions'>;

interface Props {
  navigation: Navigation;
}

const display = (value: unknown) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const ServiceRequisitionsScreen: React.FC<Props> = ({ navigation }) => {
  const [requests, setRequests] = useState<ServiceRequisition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'SUBMITTED' | 'APPROVED'>('SUBMITTED');

  const selected = useMemo(
    () => requests.find(request => request.id === selectedId) || requests[0] || null,
    [requests, selectedId]
  );

  const volunteerEntries = useMemo(() => {
    if (!selected?.serviceVolunteers) return [];
    return Object.entries(selected.serviceVolunteers).filter(([, value]) => String(value || '').trim());
  }, [selected]);

  const loadRequests = useCallback(async (status: 'SUBMITTED' | 'APPROVED' = filter, asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await fetchServiceRequisitions(status);
      setRequests(Array.isArray(data) ? data : []);
      setSelectedId(Array.isArray(data) && data[0]?.id ? data[0].id : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service requisitions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadRequests(filter);
    }, [loadRequests, filter])
  );

  const handleFilterChange = (newFilter: 'SUBMITTED' | 'APPROVED') => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    loadRequests(newFilter);
  };

  const [downloading, setDownloading] = useState(false);
  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    if (!selected || approving) return;
    setApproving(true);
    try {
      const user = await getUser();
      await approveServiceRequisition(selected.id, user?.name || user?.email || 'Admin');
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, status: 'APPROVED' } : r));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve requisition.';
      console.log('Approve failed:', message);
    } finally {
      setApproving(false);
    }
  };

  const buildHtml = (req: ServiceRequisition) => {
    const esc = (v: unknown) => display(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const fieldRow = (label: string, value: unknown) =>
      `<div class="field"><span class="fl">${label}</span><span class="fv">${esc(value)}</span></div>`;

    const sectionHeader = (title: string) =>
      `<div class="sec-hdr">${title}</div>`;

    const checkboxList = (opts: string[], selected: string[]) =>
      opts.map(o => `<div class="cb"><span class="cbx ${selected.includes(o) ? 'on' : ''}">&#9746;</span><span class="cbl">${o}</span></div>`).join('');

    const venueOpts = ['Conference Room', 'Meeting Room', 'Mini JK Hall', 'JK Outside Compound', 'REC venue request email has been sent'];
    const reqOpts = ['MIC', 'Multimedia', 'Speakers', 'TKN Utilization', 'Laptop', 'Photographer'];

    const serviceGroupsHtml = [
      { title: 'PHMU Service', items: ['Paat Service','Nanad Service','Turn Service','Audio Video Service','Flower Service','Facilitation Service','Jura/Tabarruk Service','Announce/Notice Brd.','Nikah Service'] },
      { title: 'SSU Service', items: ['PASC','CERT','Facilitation Service','Elevator Service','Wheelchair Service','Boy Scout','Girls Guide'] },
      { title: 'SAU Service', items: ['Decoration Service','Kitchen Service','Funeral Service','Landscaping Service','Transport Service','Shoe Service','Water Service','House Keeping Service','Maintenance Service','Child Care Service','Canteen Service','Pipe Band','Flute Band','Orchestra','Event Mang. Service'] },
      { title: 'REC', items: ['Teachers','Students'] },
    ].map(group => {
      const rows = group.items.map(item => {
        const key = `${group.title}:${item}`;
        const vol = req.serviceVolunteers?.[key] || '';
        const checked = vol.trim() ? 'on' : '';
        return `<div class="svc-row"><div class="cb"><span class="cbx ${checked}">&#9746;</span><span class="cbl">${item}</span></div><span class="svc-vol">${esc(vol)}</span></div>`;
      }).join('');
      return `<div class="svc-group"><div class="svc-hdr"><span>${group.title}</span><span>Volunteers</span></div>${rows}</div>`;
    }).join('');

    const approvalItems = [
      ['Mukhi Saheb', req.mukhiSaheb],
      ['Kamadia Saheb', req.kamadiaSaheb],
      ['Director (Gents)', req.directorGent],
      ['Director (Ladies)', req.directorLadies],
      ['REC', req.rec],
      ['Study Circle', req.studyCircle],
    ].map(([label, val]) =>
      `<div class="apv-cell"><div class="apv-lbl">${label}</div><div class="apv-sig"></div><div class="apv-val">${esc(val)}</div></div>`
    ).join('');

    return `<html><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
      .page { width: 100%; border: 1.5px solid #000; padding: 12px; }
      .hdr { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 6px; }
      .hdr .kicker { font-size: 9px; color: #333; }
      .hdr .org { font-size: 16px; font-weight: bold; margin-top: 2px; }
      .hdr .ftitle { font-size: 14px; font-weight: bold; margin-top: 4px; }
      .hdr .instr { font-size: 9px; color: #555; margin-top: 2px; }
      .sec-hdr { background: #e0e0e0; border: 1px solid #000; padding: 5px 8px; font-weight: bold; font-size: 11px; margin-top: 8px; }
      .two-col { display: flex; border: 1px solid #000; border-top: 0; }
      .col { flex: 1; padding: 6px; }
      .field { margin-bottom: 4px; }
      .fl { font-size: 9px; color: #333; display: block; }
      .fv { font-size: 11px; border-bottom: 1px solid #000; display: block; padding: 2px 0; min-height: 14px; }
      .bbox { border: 1px solid #000; border-top: 0; padding: 8px; }
      .cb { display: inline-flex; align-items: center; margin-right: 10px; }
      .cbx { font-size: 12px; margin-right: 3px; }
      .cbx.on { font-weight: bold; }
      .cbl { font-size: 10px; }
      .svc-group { border: 1px solid #000; margin-bottom: 6px; }
      .svc-hdr { display: flex; justify-content: space-between; background: #f0f0f0; padding: 4px 6px; border-bottom: 1px solid #000; font-weight: bold; font-size: 10px; }
      .svc-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 6px; border-bottom: 0.5px solid #ccc; }
      .svc-vol { font-size: 10px; width: 50px; text-align: center; border: 1px solid #000; padding: 1px; }
      .sig-lbl { font-size: 10px; font-weight: bold; margin-bottom: 4px; }
      .sig-line { border-bottom: 1px solid #000; height: 1px; margin-bottom: 4px; }
      .apv-grid { display: flex; flex-wrap: wrap; }
      .apv-cell { width: 47%; margin-bottom: 8px; margin-right: 3%; }
      .apv-lbl { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
      .apv-sig { border-bottom: 1px solid #000; height: 1px; margin-bottom: 2px; }
      .apv-val { font-size: 10px; }
      .ta { font-size: 11px; min-height: 70px; padding: 4px; }
    </style></head><body>
      <div class="page">
        <div class="hdr">
          <div class="kicker">Ismaili Volunteer and Facilitation Management Service</div>
          <div class="org">Noorabad Jamatkhana</div>
          <div class="ftitle">Service Requisition Form</div>
          <div class="instr">Please fill in all required fields. Use N/A where not applicable.</div>
        </div>

        ${sectionHeader('Program Details')}
        <div class="two-col">
          <div class="col">
            ${fieldRow('Service Request Date', req.requestDate)}
            ${fieldRow('Program/Event Title', req.programTitle)}
            ${fieldRow('Organizing Institution', req.organisingInstitution)}
            ${fieldRow('Collaborating Institute(s)', req.collaboratingInstitutes)}
            ${fieldRow('Invited Guest', req.invitedGuest)}
          </div>
          <div class="col">
            ${fieldRow('Day(s) & Date(s)', req.eventDate)}
            ${fieldRow('Start Time', req.startTime)}
            ${fieldRow('End Time', req.endTime)}
            ${fieldRow('Duration', req.duration)}
            ${fieldRow('Target Audience', req.targetAudience)}
            ${fieldRow('Age Group', req.ageGroup)}
            ${fieldRow('Expected Gathering', req.expectedGathering)}
          </div>
        </div>

        ${sectionHeader('Objectives and Brief Details of the Programme')}
        <div class="bbox"><div class="ta">${esc(req.objectives)}</div></div>

        ${sectionHeader('Venue Required')}
        <div class="bbox">
          ${checkboxList(venueOpts, req.venues || [])}
          ${fieldRow('Other Venue / Notes', req.otherVenue)}
          ${fieldRow('Number of Chairs Required', req.chairsRequired)}
        </div>

        ${sectionHeader('Other Requirements')}
        <div class="bbox">
          ${checkboxList(reqOpts, req.requirements || [])}
          ${fieldRow('Other Requirements (Notes)', req.otherRequirements)}
        </div>

        ${sectionHeader('Services of Other Institution Required')}
        <div class="bbox">
          <div class="cb"><span class="cbl">Services Required: <b>${req.servicesRequired ? 'Yes' : 'No'}</b></span></div>
          ${serviceGroupsHtml}
          ${fieldRow('TKN / Information', req.tkService)}
        </div>

        ${sectionHeader('Requester')}
        <div class="bbox">
          <div class="two-col" style="border:0;">
            <div class="col">
              ${fieldRow('Requester Name', req.requestorName)}
              ${fieldRow('Contact Details', req.contactDetails)}
            </div>
            <div class="col">
              <div class="sig-lbl">Signature:</div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>

        ${sectionHeader('Approval Section')}
        <div class="bbox">
          <div class="apv-grid">${approvalItems}</div>
        </div>
      </div>
    </body></html>`;
  };

  const downloadPdf = async () => {
    if (!selected || downloading) return;
    setDownloading(true);
    try {
      const options = {
        html: buildHtml(selected),
        fileName: `requisition_${selected.id}`,
        directory: 'Documents',
        width: 595,
        height: 842,
        padding: 24,
      };
      const file = await generatePDF(options);
      console.log('PDF generated:', file.filePath);
      if (Platform.OS === 'android' && file.filePath) {
        await ReactNativeBlobUtil.android.actionViewIntent(file.filePath, 'application/pdf');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate PDF.';
      console.log('PDF generation failed:', message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScreenLayout
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRequests(filter, true)} />}
    >
      <View style={[screenStyles.card, { borderRadius: 10, padding: 12 }]}>
        <ScreenHeader
          title="Service Requisitions"
          subtitle="Review submitted requests"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'SUBMITTED' && styles.filterTabActive]}
            onPress={() => handleFilterChange('SUBMITTED')}
          >
            <Text style={[styles.filterTabText, filter === 'SUBMITTED' && styles.filterTabTextActive]}>
              Pending Approval
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'APPROVED' && styles.filterTabActive]}
            onPress={() => handleFilterChange('APPROVED')}
          >
            <Text style={[styles.filterTabText, filter === 'APPROVED' && styles.filterTabTextActive]}>
              Approved
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.muted}>Loading service requisitions...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <PrimaryButton title="Retry" onPress={() => loadRequests()} />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.muted}>
              {filter === 'SUBMITTED'
                ? 'No pending service requisitions found.'
                : 'No approved service requisitions found.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {requests.map(request => (
                <TouchableOpacity
                  key={request.id}
                  style={[styles.listItem, selected?.id === request.id && styles.listItemActive]}
                  onPress={() => setSelectedId(request.id)}
                >
                  <Text style={styles.listTitle}>{request.programTitle}</Text>
                  <Text style={styles.listMeta}>
                    {formatDate(request.eventDate)} · {request.requestorName || 'No requester'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selected ? (
              <View style={styles.a4Page}>
                <View style={styles.headerSection}>
                  <Text style={styles.orgKicker}>Ismaili Volunteer and Facilitation Management Service</Text>
                  <Text style={styles.orgTitle}>Noorabad Jamatkhana</Text>
                  <Text style={styles.formTitle}>Service Requisition Form</Text>
                  <Text style={styles.formInstruction}>Please fill in all required fields. Use N/A where not applicable.</Text>
                </View>

                <SectionHeader title="Program Details" />
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <DetailField label="Service Request Date" value={selected.requestDate} />
                    <DetailField label="Program/Event Title" value={selected.programTitle} />
                    <DetailField label="Organizing Institution" value={selected.organisingInstitution} />
                    <DetailField label="Collaborating Institute(s)" value={selected.collaboratingInstitutes} />
                    <DetailField label="Invited Guest" value={selected.invitedGuest} />
                  </View>
                  <View style={styles.col}>
                    <DetailField label="Day(s) & Date(s)" value={selected.eventDate} />
                    <DetailField label="Start Time" value={selected.startTime} />
                    <DetailField label="End Time" value={selected.endTime} />
                    <DetailField label="Duration" value={selected.duration} />
                    <DetailField label="Target Audience" value={selected.targetAudience} />
                    <DetailField label="Age Group" value={selected.ageGroup} />
                    <DetailField label="Expected Gathering" value={selected.expectedGathering} />
                  </View>
                </View>

                <SectionHeader title="Objectives and Brief Details of the Programme" />
                <View style={styles.borderedBox}>
                  <Text style={styles.docText}>{display(selected.objectives)}</Text>
                </View>

                <SectionHeader title="Venue Required" />
                <View style={styles.borderedBox}>
                  <View style={styles.checkboxRow}>
                    {['Conference Room', 'Meeting Room', 'Mini JK Hall', 'JK Outside Compound', 'REC venue request email has been sent'].map(opt => (
                      <View key={opt} style={styles.checkboxItem}>
                        <Text style={styles.checkboxBox}>{(selected.venues || []).includes(opt) ? '☑' : '☐'}</Text>
                        <Text style={styles.checkboxLabel}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                  <DetailField label="Other Venue / Notes" value={selected.otherVenue} />
                  <DetailField label="Number of Chairs Required" value={selected.chairsRequired} />
                </View>

                <SectionHeader title="Other Requirements" />
                <View style={styles.borderedBox}>
                  <View style={styles.checkboxRow}>
                    {['MIC', 'Multimedia', 'Speakers', 'TKN Utilization', 'Laptop', 'Photographer'].map(opt => (
                      <View key={opt} style={styles.checkboxItem}>
                        <Text style={styles.checkboxBox}>{(selected.requirements || []).includes(opt) ? '☑' : '☐'}</Text>
                        <Text style={styles.checkboxLabel}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                  <DetailField label="Other Requirements (Notes)" value={selected.otherRequirements} />
                </View>

                <SectionHeader title="Services of Other Institution Required" />
                <View style={styles.borderedBox}>
                  <Text style={styles.helper}>Services Required: {selected.servicesRequired ? 'Yes' : 'No'}</Text>
                  {[
                    { title: 'PHMU Service', items: ['Paat Service','Nanad Service','Turn Service','Audio Video Service','Flower Service','Facilitation Service','Jura/Tabarruk Service','Announce/Notice Brd.','Nikah Service'] },
                    { title: 'SSU Service', items: ['PASC','CERT','Facilitation Service','Elevator Service','Wheelchair Service','Boy Scout','Girls Guide'] },
                    { title: 'SAU Service', items: ['Decoration Service','Kitchen Service','Funeral Service','Landscaping Service','Transport Service','Shoe Service','Water Service','House Keeping Service','Maintenance Service','Child Care Service','Canteen Service','Pipe Band','Flute Band','Orchestra','Event Mang. Service'] },
                    { title: 'REC', items: ['Teachers','Students'] },
                  ].map(group => (
                    <View key={group.title} style={styles.serviceGroup}>
                      <View style={styles.serviceGroupHeader}>
                        <Text style={styles.serviceGroupTitle}>{group.title}</Text>
                        <Text style={styles.serviceGroupCol}>Volunteers</Text>
                      </View>
                      {group.items.map(item => {
                        const key = `${group.title}:${item}`;
                        const vol = selected.serviceVolunteers?.[key] || '';
                        return (
                          <View key={key} style={styles.serviceRow}>
                            <View style={styles.checkboxItem}>
                              <Text style={styles.checkboxBox}>{vol.trim() ? '☑' : '☐'}</Text>
                              <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                            <Text style={styles.serviceVol}>{display(vol)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  <DetailField label="TKN / Information" value={selected.tkService} />
                </View>

                <SectionHeader title="Requester" />
                <View style={styles.borderedBox}>
                  <View style={[styles.twoCol, { borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 }]}>
                    <View style={styles.col}>
                      <DetailField label="Requester Name" value={selected.requestorName} />
                      <DetailField label="Contact Details" value={selected.contactDetails} />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.sigLabel}>Signature:</Text>
                      <View style={styles.sigLine} />
                    </View>
                  </View>
                </View>

                <SectionHeader title="Approval Section" />
                <View style={styles.borderedBox}>
                  <View style={styles.approvalGrid}>
                    {[
                      ['Mukhi Saheb', selected.mukhiSaheb],
                      ['Kamadia Saheb', selected.kamadiaSaheb],
                      ['Director (Gents)', selected.directorGent],
                      ['Director (Ladies)', selected.directorLadies],
                      ['REC', selected.rec],
                      ['Study Circle', selected.studyCircle],
                    ].map(([label, val]) => (
                      <View key={label as string} style={styles.approvalCell}>
                        <Text style={styles.approvalLabel}>{label}</Text>
                        <View style={styles.sigLine} />
                        <Text style={styles.approvalVal}>{display(val)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {filter === 'SUBMITTED' && (
                    <PrimaryButton
                      title={selected.status === 'APPROVED' ? 'Approved ✓' : 'Approve'}
                      variant="secondary"
                      onPress={handleApprove}
                      loading={approving}
                      disabled={approving || selected.status === 'APPROVED'}
                    />
                  )}
                  <PrimaryButton
                    title="Download PDF"
                    variant="secondary"
                    onPress={downloadPdf}
                    loading={downloading}
                    disabled={downloading}
                  />
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </ScreenLayout>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeaderBar}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const DetailField: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
  <View style={styles.detailField}>
    <Text style={styles.detailFieldLabel}>{label}</Text>
    <Text style={styles.detailFieldValue}>{display(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    // alignItems: 'center',
   
    paddingHorizontal: 14,
  },
  center: {
    gap: 12,
    paddingVertical: 28,
    alignItems: 'center',
  },
  muted: {
    color: COLORS.gray,
    textAlign: 'center',
  },
  error: {
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '700',
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  listItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dce4ec',
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  listItemActive: {
    borderColor: '#0b5a79',
    backgroundColor: '#e9f7fb',
  },
  listTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  listMeta: {
    color: COLORS.gray,
    marginTop: 4,
  },
  a4Page: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#000',
    padding: 10,
    marginTop: 22,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 6,
  },
  orgKicker: {
    fontSize: 9,
    color: '#333',
  },
  orgTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  formInstruction: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  sectionHeaderBar: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  twoCol: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  col: {
    flex: 1,
    flexShrink: 1,
    padding: 5,
    gap: 4,
  },
  borderedBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    padding: 8,
    gap: 6,
  },
  detailField: {
    marginBottom: 2,
    flexShrink: 1,
  },
  detailFieldLabel: {
    fontSize: 9,
    color: '#333',
    marginBottom: 1,
    flexShrink: 1,
  },
  detailFieldValue: {
    fontSize: 11,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    minHeight: 14,
    flexShrink: 1,
  },
  docText: {
    fontSize: 11,
    color: '#000',
    minHeight: 50,
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  checkboxBox: {
    fontSize: 12,
    color: '#000',
  },
  checkboxLabel: {
    fontSize: 10,
    color: '#000',
    flexShrink: 1,
  },
  helper: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
  },
  serviceGroup: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 6,
  },
  serviceGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  serviceGroupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  serviceGroupCol: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  serviceVol: {
    fontSize: 10,
    color: '#000',
  },
  sigLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sigLine: {
    height: 1,
    backgroundColor: '#000',
    marginBottom: 4,
  },
  approvalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  approvalCell: {
    width: '47%',
    marginBottom: 6,
    flexShrink: 1,
  },
  approvalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  approvalVal: {
    fontSize: 10,
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dce4ec',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  filterTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray,
  },
  filterTabTextActive: {
    color: '#fff',
  },
});

export default ServiceRequisitionsScreen;
