import AuthorityMember from '../AuthorityMember';

export default function AuthorityMemberExample() {
  return (
    <div className="p-6 max-w-sm">
      <AuthorityMember
        name="Dr. Narendra Patil"
        designation="OSD - Officer on Special Duty"
        email="narendra.patil@vmddp.gov.in"
        phone="+91 98765 43210"
        initials="NP"
      />
    </div>
  );
}
