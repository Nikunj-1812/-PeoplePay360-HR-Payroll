const { sql } = require('../db');

// Create a single notification for a specific user ID
async function createNotification(userId, { title, message, type = 'info', link_tab = null }) {
  if (!userId) return null;
  const [notification] = await sql`
    INSERT INTO notifications (user_id, title, message, type, link_tab)
    VALUES (${parseInt(userId, 10)}, ${title}, ${message}, ${type}, ${link_tab})
    RETURNING *
  `;
  return notification;
}

// Send notification to all users matching any of the specified roles (e.g. ['admin', 'hr_manager'])
async function notifyRoles(rolesArray = [], { title, message, type = 'info', link_tab = null }) {
  if (!rolesArray || rolesArray.length === 0) return [];
  
  const targetUsers = await sql`
    SELECT id FROM users WHERE role = ANY(${rolesArray})
  `;

  const createdList = [];
  for (const u of targetUsers) {
    const notif = await createNotification(u.id, { title, message, type, link_tab });
    if (notif) createdList.push(notif);
  }
  return createdList;
}

// Send notification to the user linked to a specific employee_id
async function notifyEmployeeUser(employeeId, { title, message, type = 'info', link_tab = null }) {
  if (!employeeId) return null;
  const users = await sql`
    SELECT u.id 
    FROM users u
    JOIN employees e ON (u.employee_id = e.id OR LOWER(u.email) = LOWER(e.email))
    WHERE e.id = ${parseInt(employeeId, 10)}
  `;

  if (users.length === 0) return null;
  return await createNotification(users[0].id, { title, message, type, link_tab });
}

// Get recent notifications for a user
async function getUserNotifications(userId) {
  const cleanUserId = parseInt(userId, 10);
  const notifications = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${cleanUserId}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const [unreadRes] = await sql`
    SELECT COUNT(*)::int as count FROM notifications
    WHERE user_id = ${cleanUserId} AND is_read = FALSE
  `;

  return {
    notifications,
    unread_count: unreadRes ? unreadRes.count : 0
  };
}

// Mark single notification as read
async function markAsRead(id, userId) {
  const [updated] = await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ${parseInt(id, 10)} AND user_id = ${parseInt(userId, 10)}
    RETURNING *
  `;
  return updated;
}

// Mark all unread notifications for a user as read
async function markAllAsRead(userId) {
  await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = ${parseInt(userId, 10)} AND is_read = FALSE
  `;
  return { success: true };
}

module.exports = {
  createNotification,
  notifyRoles,
  notifyEmployeeUser,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
