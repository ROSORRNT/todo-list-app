/*global app, jasmine, describe, it, beforeEach, expect */

describe('controller', function () {
	'use strict';

	var subject, model, view;

	var setUpModel = function (todos) {
		model.read.and.callFake(function (query, callback) {
			callback = callback || query;
			callback(todos);
		});

		model.getCount.and.callFake(function (callback) {

			var todoCounts = {
				active: todos.filter(function (todo) {
					return !todo.completed;
				}).length,
				completed: todos.filter(function (todo) {
					return !!todo.completed;
				}).length,
				total: todos.length
			};
			callback(todoCounts);
		});

		model.remove.and.callFake(function (id, callback) {
			callback();
		});

		model.create.and.callFake(function (title, callback) {
			callback();
		});

		model.update.and.callFake(function (id, updateData, callback) {
			callback();
		});
	};

	var createViewStub = function () {
		// create a test double (a spy) of the dependency (view)
		var eventRegistry = {};
		return {
			render: jasmine.createSpy('render'), // spy on view.render
			bind: function (event, handler) {
				eventRegistry[event] = handler;
			},
			trigger: function (event, parameter) {
				eventRegistry[event](parameter);
			}
		};
	};

	beforeEach(function () {
		model = jasmine.createSpyObj('model', ['read', 'getCount', 'remove', 'create', 'update']);
		view = createViewStub();
		subject = new app.Controller(model, view);
	});

	it('should show entries on start-up', function () {
		// arrange : Organisation des entrée
		var todos = [{title: 'my todoOne'}, {title: 'my todoTwo'}]; 

		// action : filtering based on active page when we start-up (no hash)
		setUpModel(todos); // Le model récupère notre liste
		subject.setView(''); // Le controller charge et initialise la vue

		// assert : view.render have been called with :
		expect(todos).toBeDefined();
		expect(view.render).toHaveBeenCalled();
		expect(view.render).toHaveBeenCalledWith('showEntries', todos);
	});

	describe('routing', function () {

		it('should show all entries without a route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show all entries without "all" route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('#/');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show active entries', function () {

		// arrange : Set a todo with "completed" prop as false 
			var todo = {title: 'todo', completed: false};
			
		// action : todo render filtering based on the route with hash : #/active
			setUpModel([todo]);
			subject.setView('#/active');

		// assert :
			expect(todo).toBeDefined(); 
			expect(todo.completed).toEqual(false); 
			expect(model.read).toHaveBeenCalledWith({completed: false}, jasmine.any(Function)); 
			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
			expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
			expect(view.render).not.toHaveBeenCalledWith('setFilter', 'completed');
		});

		it('should show completed entries', function () {

		// arrange : Set a todo with "completed" prop as true 
			var todo = {title: 'todo', completed: true};

		// action : todo render filtering based on the route with hash : #/completed
			setUpModel([todo]);
			subject.setView('#/completed');

		// assert : 
			expect(todo).toBeDefined(); 
			expect(todo.completed).toEqual(true); 
			expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function)); 
			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
			expect(view.render).toHaveBeenCalledWith('setFilter', 'completed');
			expect(view.render).not.toHaveBeenCalledWith('setFilter', 'active');
		});
	});

	it('should show the content block when todos exists', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: true
		});
	});

	it('should hide the content block when no todos exists', function () {
		setUpModel([]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: false
		});
	});

	it('should check the toggle all button, if all todos are completed', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('toggleAll', {
			checked: true
		});
	});

	it('should set the "clear completed" button', function () {
		var todo = {id: 42, title: 'my todo', completed: true};
		setUpModel([todo]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
			completed: 1,
			visible: true
		});
	});

	it('should highlight "All" filter by default', function () {

		// arrange : Set todos with "completed" prop as true or false 
		var todos = [{title: 'my todoOne', completed: true}, {title: 'my todoTwo', completed: false}]
		
		// action : load and initialize the default view (without any hash specification)
		setUpModel(todos);
		subject.setView('');

		// assert : render method is should be called with "" 
		// in _updateFilterState() : if (currentPage === "") { this._activeRoute = "All";}
		expect(todos).toBeDefined();
		expect(view.render).toHaveBeenCalledWith('setFilter', ""); // 'setFilter' + currentPage

		expect(model.read).toHaveBeenCalledWith(jasmine.any(Function));
		expect(model.read).not.toHaveBeenCalledWith({completed: true}, jasmine.any(Function));
		expect(model.read).not.toHaveBeenCalledWith({completed: false}, jasmine.any(Function));
	});

	it('should highlight "Active" filter when switching to active view', function () {

	// arrange : Set a todo with an active enterie 
		var todo = {title: 'todo', completed: false};

	// action : initialize the state where we have switching to the active view
		setUpModel([todo]);
		subject.setView('#/active');

	// assert : render method is should be called with the 'active' agrument   
		expect(todo).toBeDefined();
		expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
	});

	describe('toggle all', function () {
		it('should toggle all todos to completed', function () {

		// arrange : for a model with several active todo		
			var todos = [
				{id: 42, title: 'todoOne', completed: false},
				{id: 43, title: 'todoTwo', completed: false}
			]

		// action : pass the viewCmd which assign for all checked value, the checked value of the parameter 
			setUpModel(todos);
			subject.setView('');
			view.trigger('toggleAll', {completed: true}); // event + parameter 

		// assert : update method should be called with an argument {completed: true}  
			expect(todos).toBeDefined();
			expect(model.update).toHaveBeenCalledTimes(2);
			expect(model.update).toHaveBeenCalledWith(42, {completed: true}, jasmine.any(Function));
			expect(model.update).toHaveBeenCalledWith(43, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {

		// arrange : for a model with several active todo (completed todos are not counted cf. l.234) 
		var todos = [
			{id: 42, title: 'todoOne', completed: false},
			{id: 43, title: 'todoTwo', completed: false}
		]
		
		// action : run the view with update model
			setUpModel(todos);
			subject.setView('');

		// assert : render method should be called with a viewCmd and his parameter who set the new content (the update view)
			expect(model.read).toHaveBeenCalledTimes(1);
			expect(view.render).toHaveBeenCalledWith('updateElementCount', 2);
		});
	});

	describe('new todo', function () {
		it('should add a new todo to the model', function () {

			// arrange : Organize an empty set of entries

			//action : trigger a 'newTodo' action (take a title and call addItem() with it)
			setUpModel([]);
			subject.setView('');
			view.trigger('newTodo', 'my new todo'); 

			// assert : model.create has been called with the set title, and the callback as arguments
			expect(model.create).toHaveBeenCalledWith('my new todo', jasmine.any(Function));
		});

		it('should add a new todo to the view', function () {
			setUpModel([]);

			subject.setView('');

			view.render.calls.reset();
			model.read.calls.reset();
			model.read.and.callFake(function (callback) {
				callback([{
					title: 'a new todo',
					completed: false
				}]);
			});

			view.trigger('newTodo', 'a new todo');

			expect(model.read).toHaveBeenCalled();

			expect(view.render).toHaveBeenCalledWith('showEntries', [{
				title: 'a new todo',
				completed: false
			}]);
		});

		it('should clear the input field when a new todo is added', function () {
			setUpModel([]);

			subject.setView('');

			view.trigger('newTodo', 'a new todo');

			expect(view.render).toHaveBeenCalledWith('clearNewTodo');
		});
	});

	describe('element removal', function () {
		it('should remove an entry from the model', function () {

			// arrange : set up an entry to be removed
			var todo = {id: 42, title: 'my todo', completed: true};

			// action : trigger a 'itRemove' action and pass to it the id of the element to be removal
			setUpModel([todo]);
			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			//  model.remove has been called with the id passed to him
			expect(todo).toBeDefined();
			expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
		});

		it('should remove an entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});

		it('should update the element count', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('updateElementCount', 0);
		});
	});

	describe('remove completed', function () {
		it('should remove a completed entry from the model', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function));
			expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
		});

		it('should remove a completed entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});
	});

	describe('element complete toggle', function () {
		it('should update the model', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 21, completed: true});

			expect(model.update).toHaveBeenCalledWith(21, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 42, completed: false});

			expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 42, completed: false});
		});
	});

	describe('edit item', function () {
		it('should switch to edit mode', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEdit', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItem', {id: 21, title: 'my todo'});
		});

		it('should leave edit mode on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'new title'});
		});

		it('should persist the changes on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(model.update).toHaveBeenCalledWith(21, {title: 'new title'}, jasmine.any(Function));
		});

		it('should remove the element from the model when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(model.remove).toHaveBeenCalledWith(21, jasmine.any(Function));
		});

		it('should remove the element from the view when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(view.render).toHaveBeenCalledWith('removeItem', 21);
		});

		it('should leave edit mode on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'my todo'});
		});

		it('should not persist the changes on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(model.update).not.toHaveBeenCalled();
		});
	});
});
