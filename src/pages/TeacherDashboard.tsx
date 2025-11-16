const TeacherDashboard = () => {
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Панель викладача</h1>
            </header>
            <main className="dashboard-content">
                <section className="card">
                    <h3>Мої курси</h3>
                    <p>Список курсів, які ви викладаєте, буде тут.</p>
                </section>
                <section className="card">
                    <h3>Роботи для перевірки</h3>
                    <p>Роботи, що очікують на перевірку, з'являться тут.</p>
                </section>
            </main>
        </div>
    );
};

export default TeacherDashboard;