import React, { useState, useEffect } from 'react';
import Section from '../components/Section';
import { pillars } from '../mockData';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertTriangle, FileText, ClipboardList, ChevronRight, BookOpen, Download, Lock } from 'lucide-react';

// ─── Content for each section ─────────────────────────────────────────────────

const MATURITY_LEVELS = [
    {
        level: 1,
        name: 'Foundational',
        color: '#94A3B8',
        bg: '#F8FAFC',
        description: 'Ad-hoc risk management with no formal AI governance structure. Risks are addressed reactively and inconsistently.',
        characteristics: [
            'No dedicated AI risk policy or owner',
            'Model inventory non-existent or informal',
            'Risk assessments performed only after incidents',
            'No third-party AI vendor due diligence',
        ],
        actions: [
            'Appoint an AI Risk Owner or Committee',
            'Begin inventorying all AI/ML systems in use',
            'Draft a preliminary AI Acceptable Use Policy',
        ],
    },
    {
        level: 2,
        name: 'Defined',
        color: '#3B82F6',
        bg: '#EFF6FF',
        description: 'Standardised definitions and baseline controls are documented. Governance exists but is not consistently applied.',
        characteristics: [
            'Formal AI governance policy documented',
            'Basic model register maintained',
            'Risk taxonomy defined and communicated',
            'Initial bias and fairness checks performed',
        ],
        actions: [
            'Implement a standardised model risk assessment template',
            'Establish a mandatory AI procurement checklist',
            'Train all AI project leads on governance policy',
        ],
    },
    {
        level: 3,
        name: 'Managed',
        color: '#8B5CF6',
        bg: '#FAF5FF',
        description: 'Quantitative metrics are tracked and governance controls are continuously monitored across the AI lifecycle.',
        characteristics: [
            'KRIs and KPIs tracked for all material AI systems',
            'Continuous model drift and bias monitoring active',
            'Third-party AI audit completed annually',
            'Incident response playbook tested and operational',
        ],
        actions: [
            'Integrate AI risk metrics into ERM dashboard',
            'Conduct annual red-team exercise on critical AI systems',
            'Deploy automated model monitoring tooling',
        ],
    },
    {
        level: 4,
        name: 'Optimized',
        color: '#003366',
        bg: '#EFF6FF',
        description: 'Adaptive governance with real-time feedback loops. AI risk management is embedded across the entire organisation.',
        characteristics: [
            'Real-time AI risk dashboard available to board',
            'Fully automated model validation pipeline',
            'AI governance integrated with enterprise ESG reporting',
            'Continuous regulatory horizon scanning in place',
        ],
        actions: [
            'Publish annual AI Transparency Report',
            'Contribute to industry standards and working groups',
            'Evolve governance to address agentic and generative AI',
        ],
    },
];

const IMPLEMENTATION_GUIDE = [
    {
        phase: 'Phase 1',
        title: 'Governance Foundation',
        duration: '0–3 months',
        icon: '🏛️',
        steps: [
            { step: '1.1', title: 'Establish an AI Risk Committee', desc: 'Form a cross-functional committee including Legal, Compliance, IT, and Business unit heads. Define charter, cadence, and escalation paths.' },
            { step: '1.2', title: 'Appoint an AI Risk Owner', desc: 'Designate a senior individual (CISO, Chief Risk Officer, or equivalent) as accountable owner for the AI Risk Framework.' },
            { step: '1.3', title: 'Draft the AI Acceptable Use Policy', desc: 'Document approved AI use cases, prohibited applications, data handling requirements, and employee obligations.' },
            { step: '1.4', title: 'Build the AI System Inventory', desc: 'Catalogue all AI/ML systems in production, development, and evaluation. Include vendor-provided and embedded AI features.' },
        ],
    },
    {
        phase: 'Phase 2',
        title: 'Risk Assessment',
        duration: '3–6 months',
        icon: '🔍',
        steps: [
            { step: '2.1', title: 'Apply the AI Risk Classification Matrix', desc: 'Classify each system by impact (high/medium/low) and risk domain (bias, security, operational, reputational). Align to EU AI Act risk tiers where applicable.' },
            { step: '2.2', title: 'Conduct Model Risk Assessments', desc: 'For each material AI system, complete a structured MRA covering model purpose, training data quality, validation approach, and residual risk.' },
            { step: '2.3', title: 'Perform Vendor AI Due Diligence', desc: 'Assess third-party AI tools against the ARC Vendor Assessment Template covering transparency, security, bias controls, and contractual safeguards.' },
            { step: '2.4', title: 'Map Regulatory Obligations', desc: 'Identify applicable AI regulations (EU AI Act, NIST AI RMF, ISO 42001, sector-specific rules) and map them to internal controls.' },
        ],
    },
    {
        phase: 'Phase 3',
        title: 'Controls & Monitoring',
        duration: '6–12 months',
        icon: '🛡️',
        steps: [
            { step: '3.1', title: 'Implement Technical Controls', desc: 'Deploy model explainability tools, drift detection, differential privacy where required, and adversarial robustness testing.' },
            { step: '3.2', title: 'Establish Continuous Monitoring', desc: 'Define KRIs, KPIs, and alert thresholds for all high-risk AI systems. Integrate with existing SIEM and risk dashboards.' },
            { step: '3.3', title: 'Build an AI Incident Response Plan', desc: 'Define roles, escalation paths, communication protocols, and remediation playbooks for AI-specific incidents including bias events and model failures.' },
        ],
    },
    {
        phase: 'Phase 4',
        title: 'Audit & Optimisation',
        duration: 'Ongoing',
        icon: '📊',
        steps: [
            { step: '4.1', title: 'Conduct Annual AI Governance Audit', desc: 'Assess adherence to the framework, control effectiveness, and regulatory changes. Produce a formal audit report for the Board.' },
            { step: '4.2', title: 'Publish an AI Transparency Report', desc: 'Disclose material AI use cases, governance posture, and risk mitigations to stakeholders. Align to emerging disclosure standards.' },
            { step: '4.3', title: 'Iterate the Framework', desc: 'Update the framework annually to reflect new AI capabilities (agents, multimodal models), regulatory developments, and lessons learned.' },
        ],
    },
];

const AUDIT_TEMPLATES = [
    {
        id: 'T-01',
        title: 'AI System Intake & Classification Form',
        category: 'Governance',
        format: 'Excel / PDF',
        description: 'Used at the point of procuring or deploying any new AI system. Captures system purpose, owner, data inputs, intended user base, and initial risk classification.',
        fields: ['System Name & Owner', 'Business Use Case', 'Data Sources & Sensitivity', 'Regulatory Applicability', 'Initial Risk Tier (High / Medium / Low)', 'Approval Signatures'],
    },
    {
        id: 'T-02',
        title: 'Model Risk Assessment (MRA) Template',
        category: 'Risk Assessment',
        format: 'Word / Notion',
        description: 'A structured 6-section assessment covering model purpose, design, validation, deployment controls, monitoring, and residual risk — aligned to SR 11-7 and NIST AI RMF.',
        fields: ['Model Purpose & Scope', 'Training Data Lineage', 'Validation Methodology & Results', 'Known Limitations & Risks', 'Monitoring Controls', 'Residual Risk Rating & Sign-off'],
    },
    {
        id: 'T-03',
        title: 'AI Vendor Due Diligence Questionnaire',
        category: 'Third-Party Risk',
        format: 'Excel',
        description: 'A 40-question structured questionnaire for assessing external AI vendors and SaaS providers embedding AI. Covers transparency, data handling, bias controls, security, and contractual protections.',
        fields: ['Company & Product Overview', 'Data Privacy & Processing', 'Model Transparency & Explainability', 'Bias & Fairness Controls', 'Security Certifications (SOC 2, ISO 27001)', 'Contractual AI Obligations'],
    },
    {
        id: 'T-04',
        title: 'EU AI Act Compliance Checklist',
        category: 'Regulatory',
        format: 'PDF / Excel',
        description: 'A clause-mapped checklist for organisations subject to the EU AI Act. Covers high-risk system obligations, GPAI model requirements, and transparency rules with compliance status tracking.',
        fields: ['System Classification', 'Mandatory Documentation Requirements', 'Conformity Assessment Status', 'GPAI Obligations (if applicable)', 'Post-Market Monitoring Plan', 'Regulatory Submission Tracker'],
    },
    {
        id: 'T-05',
        title: 'AI Incident Report Template',
        category: 'Incident Response',
        format: 'Word / Jira',
        description: 'Standardised incident report for logging and investigating AI-related failures including bias events, adversarial attacks, data breaches, and model malfunctions.',
        fields: ['Incident Summary & Timeline', 'Systems & Data Affected', 'Root Cause Analysis', 'Regulatory Notification Required?', 'Remediation Actions & Owner', 'Lessons Learned & Framework Updates'],
    },
    {
        id: 'T-06',
        title: 'Annual AI Governance Audit Report',
        category: 'Audit',
        format: 'Word / PowerPoint',
        description: 'A board-ready annual audit report template assessing the overall health of the AI governance framework, control effectiveness, and compliance status.',
        fields: ['Scope & Methodology', 'AI System Portfolio Review', 'Control Effectiveness Ratings', 'Regulatory Compliance Status', 'Key Findings & Risk Ratings', 'Management Action Plan'],
    },
];

const CATEGORY_COLORS = {
    Governance: '#003366',
    'Risk Assessment': '#7C3AED',
    'Third-Party Risk': '#D97706',
    Regulatory: '#059669',
    'Incident Response': '#DC2626',
    Audit: '#0284C7',
};

// ─── Section renderers ────────────────────────────────────────────────────────

const CorePillarsSection = () => (
    <div>
        <h2 style={{ marginBottom: '0.5rem', color: '#1E293B' }}>Core Pillars of Oversight</h2>
        <p style={{ color: '#64748B', marginBottom: '2rem', fontSize: '0.95rem' }}>
            The six foundational pillars that every enterprise AI governance programme must address.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem' }}>
            {pillars.map((pillar, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.75rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#CBD5E1', lineHeight: '1', minWidth: '52px' }}>
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem', color: '#1E293B' }}>{pillar.title}</h3>
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.65', margin: 0 }}>{pillar.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MaturityLevelsSection = () => (
    <div>
        <h2 style={{ marginBottom: '0.5rem', color: '#1E293B' }}>AI Governance Maturity Model</h2>
        <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            Four progressive maturity levels to assess and improve your organisation's AI risk posture. Identify where you are today and what it takes to advance.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {MATURITY_LEVELS.map((ml) => (
                <div key={ml.level} style={{ background: ml.bg, border: `1.5px solid ${ml.color}25`, borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: ml.color, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: '800', fontSize: '1rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {ml.level}
                        </span>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Level {ml.level}: {ml.name}</h3>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.1rem' }}>{ml.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: ml.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Characteristics</p>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {ml.characteristics.map((c, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', fontSize: '0.83rem', color: '#475569' }}>
                                            <span style={{ color: ml.color, marginTop: '2px', flexShrink: 0 }}>•</span> {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Next Actions</p>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {ml.actions.map((a, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', fontSize: '0.83rem', color: '#475569' }}>
                                            <CheckCircle size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} /> {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ImplementationGuideSection = () => (
    <div>
        <h2 style={{ marginBottom: '0.5rem', color: '#1E293B' }}>Implementation Guide</h2>
        <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            A phased roadmap for embedding AI risk governance across your organisation — from initial policy through to continuous audit and optimisation.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {IMPLEMENTATION_GUIDE.map((phase) => (
                <div key={phase.phase} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#003366', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{phase.icon}</span>
                        <div>
                            <span style={{ color: '#93C5FD', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase.phase} · {phase.duration}</span>
                            <h3 style={{ color: 'white', margin: '2px 0 0', fontSize: '1.05rem', fontWeight: '700' }}>{phase.title}</h3>
                        </div>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {phase.steps.map((s) => (
                            <div key={s.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ background: '#EFF6FF', color: '#003366', fontSize: '0.7rem', fontWeight: '800', padding: '3px 7px', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }}>{s.step}</span>
                                <div>
                                    <p style={{ fontWeight: '700', color: '#1E293B', margin: '0 0 3px', fontSize: '0.92rem' }}>{s.title}</p>
                                    <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AuditTemplatesSection = () => (
    <div>
        <h2 style={{ marginBottom: '0.5rem', color: '#1E293B' }}>Audit Templates</h2>
        <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            Production-ready templates for AI governance, risk assessment, regulatory compliance, and audit reporting. Full templates are available to Council members.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {AUDIT_TEMPLATES.map((t) => {
                const catColor = CATEGORY_COLORS[t.category] || '#003366';
                return (
                    <div key={t.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '14px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 9px', flexShrink: 0 }}>
                                <ClipboardList size={18} color={catColor} />
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{t.id}</span>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'white', background: catColor, padding: '2px 8px', borderRadius: '4px' }}>{t.category}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginLeft: 'auto' }}>
                                        <FileText size={11} style={{ display: 'inline', marginRight: '3px' }} />{t.format}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>{t.title}</h3>
                            </div>
                        </div>
                        <div style={{ padding: '1rem 1.5rem', background: '#FAFAFA' }}>
                            <p style={{ fontSize: '0.87rem', color: '#475569', margin: '0 0 0.85rem', lineHeight: '1.6' }}>{t.description}</p>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Key Fields</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {t.fields.map((f) => (
                                        <span key={f} style={{ background: 'white', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px' }}>{f}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        <div style={{ marginTop: '2rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#1D4ED8" style={{ flexShrink: 0 }} />
            <div>
                <p style={{ fontWeight: '700', color: '#1E3A8A', margin: '0 0 3px', fontSize: '0.9rem' }}>Full templates available to Council Members</p>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#3B82F6' }}>
                    Join the AI Risk Council to download editable versions of all templates in Excel, Word, and PDF formats.
                </p>
            </div>
        </div>
    </div>
);

// ─── Security Tools Section ──────────────────────────────────────────────────
const SECURITY_TOOLS = [
    {
        name: 'Microsoft Purview',
        company: 'Microsoft',
        category: 'Data Governance & Compliance',
        color: '#0078D4',
        description: 'Unified data governance platform for managing and governing on-premises, multi-cloud, and SaaS data. Provides data discovery, classification, lineage tracking, and compliance management.',
        capabilities: ['Data classification & labeling', 'Information protection policies', 'Data loss prevention (DLP)', 'Compliance Manager with regulatory templates', 'Insider risk management'],
        frameworkAlignment: 'Essential for EU AI Act Article 10 (Data Governance) and GDPR compliance in AI training data pipelines.'
    },
    {
        name: 'Microsoft Defender for Endpoint',
        company: 'Microsoft',
        category: 'Endpoint Detection & Response',
        color: '#0078D4',
        description: 'Enterprise endpoint security platform using behavioral sensors, cloud analytics, and threat intelligence for real-time protection of AI/ML workstations and inference endpoints.',
        capabilities: ['Automated investigation & response', 'Attack surface reduction rules', 'Endpoint detection and response (EDR)', 'Threat & vulnerability management', 'Microsoft Threat Experts integration'],
        frameworkAlignment: 'Maps to NIST AI RMF GOVERN 1.5 (Infrastructure Security) and ISO 27001 Annex A controls.'
    },
    {
        name: 'Microsoft Sentinel',
        company: 'Microsoft',
        category: 'SIEM / SOAR',
        color: '#0078D4',
        description: 'Cloud-native SIEM and SOAR solution providing AI-driven threat detection, intelligent security analytics, and automated response playbooks across the enterprise.',
        capabilities: ['AI-driven anomaly detection', 'Automated incident response playbooks', 'Cross-platform log ingestion', 'UEBA (User & Entity Behavior Analytics)', 'Threat intelligence fusion'],
        frameworkAlignment: 'Supports NIST AI RMF DETECT function and continuous monitoring requirements in ISO 42001.'
    },
    {
        name: 'CrowdStrike Falcon',
        company: 'CrowdStrike',
        category: 'EDR & Threat Intelligence',
        color: '#FF0000',
        description: 'Cloud-native endpoint protection combining next-gen antivirus, EDR, threat intelligence, and managed threat hunting. Uses AI-powered indicators of attack (IOAs) for real-time breach prevention.',
        capabilities: ['AI-powered threat prevention', 'Managed threat hunting (Falcon OverWatch)', 'Cloud workload protection', 'Identity threat detection', 'Adversary intelligence feeds'],
        frameworkAlignment: 'Critical for securing AI training infrastructure. Aligns with NIST CSF Detect and Respond functions.'
    },
    {
        name: 'Palo Alto Prisma Cloud',
        company: 'Palo Alto Networks',
        category: 'Cloud Security (CNAPP)',
        color: '#FA582D',
        description: 'Comprehensive cloud-native application protection platform securing hosts, containers, serverless functions, and multi-cloud infrastructure where AI workloads are deployed.',
        capabilities: ['Cloud Security Posture Management (CSPM)', 'Cloud Workload Protection (CWP)', 'Container and Kubernetes security', 'Infrastructure as Code (IaC) scanning', 'API security and web app firewall'],
        frameworkAlignment: 'Essential for securing cloud-based AI/ML pipelines. Maps to ISO 27017 cloud security controls.'
    },
    {
        name: 'Splunk Enterprise Security',
        company: 'Cisco / Splunk',
        category: 'SIEM & Security Analytics',
        color: '#65A637',
        description: 'Premium SIEM providing security analytics, threat detection, and incident response. Ingests machine data from virtually any source to surface real-time insights into AI model behavior and infrastructure security.',
        capabilities: ['Real-time correlation and alerting', 'Risk-based alerting (RBA)', 'MITRE ATT&CK framework mapping', 'Custom dashboards and reporting', 'Machine learning anomaly detection'],
        frameworkAlignment: 'Supports continuous monitoring per NIST AI RMF and audit trail requirements for EU AI Act compliance.'
    },
    {
        name: 'IBM Guardium',
        company: 'IBM',
        category: 'Data Security & Privacy',
        color: '#054ADA',
        description: 'Comprehensive data security platform providing activity monitoring, automated compliance workflows, vulnerability assessment, and encryption for AI training data across databases and cloud environments.',
        capabilities: ['Real-time data activity monitoring', 'Automated compliance reporting', 'Data encryption and key management', 'Vulnerability assessment', 'Dynamic data masking'],
        frameworkAlignment: 'Directly supports GDPR Article 32 (Security of Processing) and NIST AI RMF data protection requirements.'
    },
    {
        name: 'Qualys VMDR',
        company: 'Qualys',
        category: 'Vulnerability Management',
        color: '#FF0000',
        description: 'Cloud-based VMDR providing global visibility into IT assets, automated vulnerability detection, threat prioritization using real-time intelligence, and integrated patch management for secure AI deployment infrastructure.',
        capabilities: ['Continuous asset discovery', 'Risk-based vulnerability prioritization', 'Integrated patch management', 'CIS benchmark compliance scanning', 'Real-time threat intelligence correlation'],
        frameworkAlignment: 'Addresses NIST AI RMF infrastructure hardening requirements and ISO 27001 vulnerability management controls.'
    }
];

const SecurityToolsSection = () => (
    <div>
        <h2 style={{ marginBottom: '0.5rem', color: '#1E293B' }}>Security Tools & Solutions</h2>
        <p style={{ color: '#64748B', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Enterprise-grade security tools that organizations can leverage alongside our governance playbooks. These are tools we recommend and review — not products we sell.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {SECURITY_TOOLS.map((tool, idx) => (
                <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.5rem', background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ width: '8px', height: '40px', background: tool.color, borderRadius: '4px', flexShrink: 0 }} />
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1E293B' }}>{tool.name}</h3>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'white', background: tool.color, padding: '2px 8px', borderRadius: '4px' }}>{tool.company}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', marginLeft: 'auto' }}>{tool.category}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '1.1rem 1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.65', margin: '0 0 1rem' }}>{tool.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: tool.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Key Capabilities</p>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {tool.capabilities.map((c, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.82rem', color: '#475569' }}>
                                            <CheckCircle size={12} color={tool.color} style={{ flexShrink: 0, marginTop: '3px' }} /> {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Framework Alignment</p>
                                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>{tool.frameworkAlignment}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Playbooks Section ─────────────────────────────────────────────────────────
const PlaybooksSection = () => {
    const { token, isLoggedIn, API } = useAuth();
    const [playbooks, setPlaybooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/playbooks')
            .then(r => r.json())
            .then(data => { setPlaybooks(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleDownload = async (pb) => {
        if (!isLoggedIn) {
            alert('Please sign in to download playbooks. All registered members can download for free.');
            return;
        }
        try {
            const res = await fetch(`/api/playbooks/${pb.id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = pb.file_name || `${pb.title}.${pb.file_type}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert('Download failed. Please try again.'); }
    };

    const FRAMEWORK_COLORS = {
        'EU AI Act': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
        'NIST AI RMF': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
        'ISO 42001': { bg: '#FAF5FF', color: '#7C3AED', border: '#E9D5FF' },
        'GDPR': { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
        'General': { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
    };

    const CATEGORY_ICONS = { Guide: '📖', Checklist: '✅', Template: '📋', Policy: '📜' };

    const grouped = playbooks.reduce((acc, pb) => {
        const fw = pb.framework || 'General';
        if (!acc[fw]) acc[fw] = [];
        acc[fw].push(pb);
        return acc;
    }, {});

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading playbooks...</div>;

    return (
        <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>Governance Playbooks</h2>
            <p style={{ color: '#64748B', lineHeight: '1.7', marginBottom: '2rem', maxWidth: '700px' }}>
                Download comprehensive governance playbooks aligned with major AI risk frameworks. These self-service resources include templates, checklists, and step-by-step implementation guides.
                {!isLoggedIn && <span style={{ display: 'block', marginTop: '8px', color: '#D97706', fontWeight: '600', fontSize: '0.88rem' }}><Lock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Sign in to download — free for all registered members.</span>}
            </p>

            {Object.entries(grouped).map(([framework, items]) => {
                const fwStyle = FRAMEWORK_COLORS[framework] || FRAMEWORK_COLORS['General'];
                return (
                    <div key={framework} style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <span style={{ background: fwStyle.bg, color: fwStyle.color, border: `1px solid ${fwStyle.border}`, padding: '4px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700' }}>{framework}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{items.length} playbook{items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {items.map(pb => (
                                <div key={pb.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', transition: 'box-shadow 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                                    onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICONS[pb.category] || '📄'}</span>
                                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>{pb.title}</h4>
                                            <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#475569', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{pb.category}</span>
                                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#64748B', background: '#E2E8F0', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{pb.file_type}</span>
                                        </div>
                                        {pb.brief && <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: '1.55' }}>{pb.brief}</p>}
                                    </div>
                                    <button onClick={() => handleDownload(pb)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: isLoggedIn ? '#003366' : '#94A3B8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                                        {isLoggedIn ? <><Download size={14} /> Download</> : <><Lock size={14} /> Sign In</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {playbooks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <BookOpen size={40} color="#94A3B8" style={{ marginBottom: '8px' }} />
                    <p style={{ color: '#94A3B8', margin: 0 }}>No playbooks available yet. Check back soon!</p>
                </div>
            )}
        </div>
    );
};

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { key: 'pillars', label: 'Core Pillars', component: CorePillarsSection },
    { key: 'maturity', label: 'Maturity Levels', component: MaturityLevelsSection },
    { key: 'implementation', label: 'Implementation Guide', component: ImplementationGuideSection },
    { key: 'audit', label: 'Audit Templates', component: AuditTemplatesSection },
    { key: 'tools', label: 'Security Tools & Solutions', component: SecurityToolsSection },
    { key: 'playbooks', label: 'Governance Playbooks', component: PlaybooksSection },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const Framework = () => {
    const [activeSection, setActiveSection] = useState('pillars');
    const ActiveComponent = NAV_ITEMS.find(n => n.key === activeSection)?.component || CorePillarsSection;

    return (
        <>
            <Section style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>AI Risk Governance Framework</h1>
                    <p style={{ fontSize: '1.15rem', color: '#475569', fontWeight: '400', lineHeight: '1.6' }}>
                        A structured approach to identifying, measuring, and mitigating artificial intelligence risks across the enterprise lifecycle.
                    </p>
                </div>
            </Section>

            <Section>
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '3rem' }}>
                    {/* Sidebar Nav */}
                    <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#94A3B8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Framework Modules
                        </h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', padding: 0, margin: 0 }}>
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeSection === item.key;
                                return (
                                    <li
                                        key={item.key}
                                        onClick={() => setActiveSection(item.key)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.7rem 1rem',
                                            borderRadius: '8px',
                                            borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                                            background: isActive ? '#EFF6FF' : 'transparent',
                                            color: isActive ? 'var(--primary)' : '#64748B',
                                            fontWeight: isActive ? '700' : '500',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseOver={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                                        onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {item.label}
                                        {isActive && <ChevronRight size={15} color="var(--primary)" />}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Dynamic content */}
                    <div>
                        <ActiveComponent />
                    </div>
                </div>
            </Section>
        </>
    );
};

export default Framework;
