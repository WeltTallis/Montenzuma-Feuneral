 
          </form>
        </DrawerBody>
      </Drawer>

      {/* Toasts */}
      <ToastContainer>
        {toasts.map((t) => <Toast key={t.id} type={t.type} onDone={() => removeToast(t.id)}>{t.message}</Toast>)}
      </ToastContainer>
    </Container>
  );
};

export default HearseBookings;