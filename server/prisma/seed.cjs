// ============================================
// AssetFlow — Database Seed Script
// ============================================
// Run: npx prisma db seed
// Idempotent: uses upsert so safe to re-run
// Order: Admin → Departments → Categories → Employees → Assets → Allocations → Bookings → Maintenance

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Helper: hash password with bcrypt (10 rounds)
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log("🌱 Seeding AssetFlow database...\n");

  // ──────────────────────────────────────────
  // 1. BOOTSTRAP ADMIN — This MUST be first!
  // Without this, no one can be promoted via UI
  // ──────────────────────────────────────────
  console.log("1/9  Creating bootstrap Admin...");
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.employee.upsert({
    where: { email: "admin@assetflow.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@assetflow.com",
      passwordHash: adminPassword,
      role: "Admin",
      status: "Active",
    },
  });
  console.log(`     ✅ Admin created: ${admin.email} (id: ${admin.id})`);

  // ──────────────────────────────────────────
  // 2. DEPARTMENTS
  // ──────────────────────────────────────────
  console.log("2/9  Creating departments...");
  const departments = [
    { name: "Information Technology", code: "IT" },
    { name: "Operations", code: "OPS" },
    { name: "Human Resources", code: "HR" },
    { name: "Finance", code: "FIN" },
    { name: "Marketing", code: "MKT" },
  ];

  const deptRecords = {};
  for (const dept of departments) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        name: dept.name,
        code: dept.code,
        status: "Active",
      },
    });
    deptRecords[dept.code] = record;
    console.log(`     ✅ Department: ${record.name} (${record.code})`);
  }

  // ──────────────────────────────────────────
  // 3. ASSIGN ADMIN TO IT DEPARTMENT
  // ──────────────────────────────────────────
  console.log("3/9  Assigning Admin to IT department...");
  await prisma.employee.update({
    where: { id: admin.id },
    data: { departmentId: deptRecords["IT"].id },
  });
  await prisma.department.update({
    where: { id: deptRecords["IT"].id },
    data: { headId: admin.id },
  });
  console.log("     ✅ Admin assigned as IT department head");

  // ──────────────────────────────────────────
  // 4. CATEGORIES
  // ──────────────────────────────────────────
  console.log("4/9  Creating asset categories...");
  const categories = [
    {
      name: "Laptops",
      warrantyPeriod: 24,
      extraFields: { brand: "", ram: "", storage: "" },
    },
    {
      name: "Furniture",
      warrantyPeriod: 60,
      extraFields: { material: "", color: "" },
    },
    {
      name: "Vehicles",
      warrantyPeriod: 36,
      extraFields: { make: "", model: "", year: "", licensePlate: "" },
    },
    {
      name: "Meeting Rooms",
      warrantyPeriod: null,
      extraFields: { capacity: 0, hasProjector: false, hasWhiteboard: false },
    },
    {
      name: "Printers",
      warrantyPeriod: 12,
      extraFields: { type: "", colorCapable: false },
    },
    {
      name: "Monitors",
      warrantyPeriod: 24,
      extraFields: { size: "", resolution: "" },
    },
  ];

  const catRecords = {};
  for (const cat of categories) {
    // Using name as a simple lookup (no unique constraint, so we findFirst + create)
    let record = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!record) {
      record = await prisma.category.create({
        data: {
          name: cat.name,
          warrantyPeriod: cat.warrantyPeriod,
          extraFields: cat.extraFields,
        },
      });
    }
    catRecords[cat.name] = record;
    console.log(`     ✅ Category: ${record.name}`);
  }

  // ──────────────────────────────────────────
  // 5. SAMPLE EMPLOYEES (various roles)
  // ──────────────────────────────────────────
  console.log("5/9  Creating sample employees...");
  const defaultPassword = await hashPassword("password123");

  const employeesData = [
    {
      name: "Rahul Sharma",
      email: "rahul@assetflow.com",
      role: "AssetManager",
      deptCode: "IT",
    },
    {
      name: "Priya Patel",
      email: "priya@assetflow.com",
      role: "DepartmentHead",
      deptCode: "OPS",
    },
    {
      name: "Amit Kumar",
      email: "amit@assetflow.com",
      role: "DepartmentHead",
      deptCode: "HR",
    },
    {
      name: "Sneha Gupta",
      email: "sneha@assetflow.com",
      role: "Employee",
      deptCode: "IT",
    },
    {
      name: "Vikram Singh",
      email: "vikram@assetflow.com",
      role: "Employee",
      deptCode: "OPS",
    },
    {
      name: "Neha Reddy",
      email: "neha@assetflow.com",
      role: "Employee",
      deptCode: "FIN",
    },
    {
      name: "Arjun Mehta",
      email: "arjun@assetflow.com",
      role: "Employee",
      deptCode: "MKT",
    },
    {
      name: "Kavita Joshi",
      email: "kavita@assetflow.com",
      role: "Employee",
      deptCode: "HR",
    },
  ];

  const empRecords = { admin };
  for (const emp of employeesData) {
    const record = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        name: emp.name,
        email: emp.email,
        passwordHash: defaultPassword,
        role: emp.role,
        departmentId: deptRecords[emp.deptCode].id,
        status: "Active",
      },
    });
    empRecords[emp.email] = record;
    console.log(`     ✅ Employee: ${record.name} (${record.role})`);
  }

  // Set department heads
  await prisma.department.update({
    where: { id: deptRecords["OPS"].id },
    data: { headId: empRecords["priya@assetflow.com"].id },
  });
  await prisma.department.update({
    where: { id: deptRecords["HR"].id },
    data: { headId: empRecords["amit@assetflow.com"].id },
  });
  console.log("     ✅ Department heads assigned (OPS: Priya, HR: Amit)");

  // ──────────────────────────────────────────
  // 6. SAMPLE ASSETS
  // ──────────────────────────────────────────
  console.log("6/9  Creating sample assets...");
  const assetsData = [
    // Laptops
    {
      assetTag: "AF-0001",
      name: "Dell Latitude 5540",
      category: "Laptops",
      serialNumber: "DL5540-001",
      condition: "New",
      location: "IT Lab - Rack A",
      isBookable: false,
      status: "Available",
      deptCode: "IT",
      cost: 85000,
    },
    {
      assetTag: "AF-0002",
      name: "MacBook Pro 14 M3",
      category: "Laptops",
      serialNumber: "MBP14-002",
      condition: "New",
      location: "IT Lab - Rack A",
      isBookable: false,
      status: "Allocated",
      deptCode: "IT",
      cost: 199000,
    },
    {
      assetTag: "AF-0003",
      name: "ThinkPad X1 Carbon Gen 11",
      category: "Laptops",
      serialNumber: "TPX1-003",
      condition: "Good",
      location: "IT Lab - Rack B",
      isBookable: false,
      status: "Available",
      deptCode: "IT",
      cost: 145000,
    },
    // Furniture
    {
      assetTag: "AF-0004",
      name: "Ergonomic Standing Desk",
      category: "Furniture",
      serialNumber: "ESD-004",
      condition: "Good",
      location: "Floor 2 - Bay 5",
      isBookable: false,
      status: "Allocated",
      deptCode: "OPS",
      cost: 35000,
    },
    {
      assetTag: "AF-0005",
      name: "Herman Miller Aeron Chair",
      category: "Furniture",
      serialNumber: "HMA-005",
      condition: "New",
      location: "Floor 1 - Reception",
      isBookable: false,
      status: "Available",
      deptCode: null,
      cost: 95000,
    },
    // Vehicles
    {
      assetTag: "AF-0006",
      name: "Toyota Innova Crysta",
      category: "Vehicles",
      serialNumber: "TIC-006",
      condition: "Good",
      location: "Parking Lot B",
      isBookable: true,
      status: "Available",
      deptCode: "OPS",
      cost: 2100000,
    },
    {
      assetTag: "AF-0007",
      name: "Maruti Suzuki Swift",
      category: "Vehicles",
      serialNumber: "MSS-007",
      condition: "Fair",
      location: "Parking Lot A",
      isBookable: true,
      status: "Available",
      deptCode: "OPS",
      cost: 800000,
    },
    // Meeting Rooms (bookable)
    {
      assetTag: "AF-0008",
      name: "Conference Room - Falcon",
      category: "Meeting Rooms",
      serialNumber: null,
      condition: "Good",
      location: "Floor 3 - Wing A",
      isBookable: true,
      status: "Available",
      deptCode: null,
      cost: null,
    },
    {
      assetTag: "AF-0009",
      name: "Conference Room - Eagle",
      category: "Meeting Rooms",
      serialNumber: null,
      condition: "Good",
      location: "Floor 3 - Wing B",
      isBookable: true,
      status: "Available",
      deptCode: null,
      cost: null,
    },
    {
      assetTag: "AF-0010",
      name: "Huddle Room - Sparrow",
      category: "Meeting Rooms",
      serialNumber: null,
      condition: "Good",
      location: "Floor 2 - Near Cafeteria",
      isBookable: true,
      status: "Available",
      deptCode: null,
      cost: null,
    },
    // Printers
    {
      assetTag: "AF-0011",
      name: "HP LaserJet Pro MFP",
      category: "Printers",
      serialNumber: "HPLJ-011",
      condition: "Good",
      location: "Floor 1 - Print Station",
      isBookable: false,
      status: "Available",
      deptCode: "IT",
      cost: 45000,
    },
    // Monitors
    {
      assetTag: "AF-0012",
      name: 'Dell UltraSharp 27" 4K',
      category: "Monitors",
      serialNumber: "DU27-012",
      condition: "New",
      location: "IT Lab - Rack C",
      isBookable: false,
      status: "Available",
      deptCode: "IT",
      cost: 42000,
    },
    {
      assetTag: "AF-0013",
      name: 'LG 34" UltraWide',
      category: "Monitors",
      serialNumber: "LG34-013",
      condition: "Good",
      location: "Floor 2 - Dev Area",
      isBookable: false,
      status: "UnderMaintenance",
      deptCode: "IT",
      cost: 55000,
    },
    // Retired asset
    {
      assetTag: "AF-0014",
      name: "Dell Latitude 3420 (Old)",
      category: "Laptops",
      serialNumber: "DL3420-014",
      condition: "Poor",
      location: "Storage Room",
      isBookable: false,
      status: "Retired",
      deptCode: null,
      cost: 55000,
    },
    // Lost asset
    {
      assetTag: "AF-0015",
      name: "Logitech MX Keys Keyboard",
      category: "Furniture",
      serialNumber: "LMX-015",
      condition: "Good",
      location: "Unknown",
      isBookable: false,
      status: "Lost",
      deptCode: "MKT",
      cost: 12000,
    },
  ];

  const assetRecords = {};
  for (const asset of assetsData) {
    let record = await prisma.asset.findUnique({
      where: { assetTag: asset.assetTag },
    });
    if (!record) {
      record = await prisma.asset.create({
        data: {
          assetTag: asset.assetTag,
          name: asset.name,
          categoryId: catRecords[asset.category].id,
          serialNumber: asset.serialNumber,
          acquisitionDate: new Date("2025-01-15"),
          acquisitionCost: asset.cost,
          condition: asset.condition,
          location: asset.location,
          isBookable: asset.isBookable,
          status: asset.status,
          departmentId: asset.deptCode
            ? deptRecords[asset.deptCode].id
            : null,
        },
      });
    }
    assetRecords[asset.assetTag] = record;
    console.log(`     ✅ Asset: ${record.assetTag} — ${record.name}`);
  }

  // ──────────────────────────────────────────
  // 7. SAMPLE ALLOCATIONS
  // ──────────────────────────────────────────
  console.log("7/9  Creating sample allocations...");

  // MacBook Pro allocated to Sneha (active)
  const existingAlloc1 = await prisma.allocation.findFirst({
    where: {
      assetId: assetRecords["AF-0002"].id,
      employeeId: empRecords["sneha@assetflow.com"].id,
      status: "Active",
    },
  });
  if (!existingAlloc1) {
    await prisma.allocation.create({
      data: {
        assetId: assetRecords["AF-0002"].id,
        employeeId: empRecords["sneha@assetflow.com"].id,
        departmentId: deptRecords["IT"].id,
        allocatedDate: new Date("2025-06-01"),
        expectedReturnDate: new Date("2026-06-01"),
        status: "Active",
      },
    });
    console.log("     ✅ Allocation: MacBook Pro → Sneha (Active)");
  }

  // Standing Desk allocated to Vikram (active)
  const existingAlloc2 = await prisma.allocation.findFirst({
    where: {
      assetId: assetRecords["AF-0004"].id,
      employeeId: empRecords["vikram@assetflow.com"].id,
      status: "Active",
    },
  });
  if (!existingAlloc2) {
    await prisma.allocation.create({
      data: {
        assetId: assetRecords["AF-0004"].id,
        employeeId: empRecords["vikram@assetflow.com"].id,
        departmentId: deptRecords["OPS"].id,
        allocatedDate: new Date("2025-03-15"),
        expectedReturnDate: new Date("2025-09-15"),
        status: "Active",
      },
    });
    console.log("     ✅ Allocation: Standing Desk → Vikram (Active, OVERDUE for demo)");
  }

  // Returned allocation for history
  const existingAlloc3 = await prisma.allocation.findFirst({
    where: {
      assetId: assetRecords["AF-0001"].id,
      status: "Returned",
    },
  });
  if (!existingAlloc3) {
    await prisma.allocation.create({
      data: {
        assetId: assetRecords["AF-0001"].id,
        employeeId: empRecords["rahul@assetflow.com"].id,
        departmentId: deptRecords["IT"].id,
        allocatedDate: new Date("2025-01-10"),
        expectedReturnDate: new Date("2025-06-10"),
        actualReturnDate: new Date("2025-05-28"),
        conditionNotesOnReturn: "Good condition, minor wear on keyboard",
        status: "Returned",
      },
    });
    console.log("     ✅ Allocation: Dell Latitude → Rahul (Returned — history)");
  }

  // ──────────────────────────────────────────
  // 8. SAMPLE BOOKINGS
  // ──────────────────────────────────────────
  console.log("8/9  Creating sample bookings...");

  // Upcoming booking: Falcon conference room
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const existingBooking1 = await prisma.booking.findFirst({
    where: {
      resourceAssetId: assetRecords["AF-0008"].id,
      bookedByEmployeeId: empRecords["priya@assetflow.com"].id,
      status: "Upcoming",
    },
  });
  if (!existingBooking1) {
    await prisma.booking.create({
      data: {
        resourceAssetId: assetRecords["AF-0008"].id,
        bookedByEmployeeId: empRecords["priya@assetflow.com"].id,
        startTime: tomorrow,
        endTime: tomorrowEnd,
        status: "Upcoming",
      },
    });
    console.log("     ✅ Booking: Falcon Room → Priya (tomorrow 10-11 AM)");
  }

  // Another booking: Innova vehicle
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(9, 0, 0, 0);
  const dayAfterEnd = new Date(dayAfter);
  dayAfterEnd.setHours(17, 0, 0, 0);

  const existingBooking2 = await prisma.booking.findFirst({
    where: {
      resourceAssetId: assetRecords["AF-0006"].id,
      bookedByEmployeeId: empRecords["vikram@assetflow.com"].id,
      status: "Upcoming",
    },
  });
  if (!existingBooking2) {
    await prisma.booking.create({
      data: {
        resourceAssetId: assetRecords["AF-0006"].id,
        bookedByEmployeeId: empRecords["vikram@assetflow.com"].id,
        startTime: dayAfter,
        endTime: dayAfterEnd,
        status: "Upcoming",
      },
    });
    console.log("     ✅ Booking: Innova → Vikram (day after tomorrow, full day)");
  }

  // ──────────────────────────────────────────
  // 9. SAMPLE MAINTENANCE REQUEST
  // ──────────────────────────────────────────
  console.log("9/9  Creating sample maintenance request...");

  const existingMaint = await prisma.maintenanceRequest.findFirst({
    where: {
      assetId: assetRecords["AF-0013"].id,
      status: "Pending",
    },
  });
  if (!existingMaint) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: assetRecords["AF-0013"].id,
        raisedByEmployeeId: empRecords["sneha@assetflow.com"].id,
        issueDescription:
          "Monitor flickering intermittently, especially after 2+ hours of use. Possible backlight issue.",
        priority: "High",
        status: "Pending",
      },
    });
    console.log("     ✅ Maintenance: LG UltraWide — flickering issue (Pending)");
  }

  // ──────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────
  console.log("\n🎉 Seed completed successfully!");
  console.log("─".repeat(50));
  console.log("📧 Admin login:  admin@assetflow.com / admin123");
  console.log("📧 Sample users: [name]@assetflow.com / password123");
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
